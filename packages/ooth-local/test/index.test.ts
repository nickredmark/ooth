import * as express from 'express';
import * as session from 'express-session';
import { cloneDeep } from 'lodash';
import { MongoClient, Db } from 'mongodb';
import MongodbMemoryServer from 'mongodb-memory-server';
import { Ooth } from 'ooth';
import emailer from 'ooth-local-emailer';
import { OothMongo } from 'ooth-mongo';
import * as request from 'request-promise';

import oothLocal from '../src';
import { Server } from 'http';

const { Strategy } = require('passport-custom');

let mongoServer: MongodbMemoryServer;
let con: MongoClient;
let app: express.Express;
let server: Server;
let ooth: Ooth;
let db: Db;
let cookies = '';
let oothMongo: OothMongo;

const startServer = () => {
  return new Promise((resolve) => {
    server = app.listen(8080, resolve);
  });
};

const obfuscate = (obj: any, ...paths: string[]) => {
  const res = cloneDeep(obj);
  for (const path of paths) {
    const keys = path.split('.');
    let current = res;
    for (const key of keys.slice(0, -1)) {
      current = current[key];
    }
    current[keys[keys.length - 1]] = '<obfuscated>';
  }

  return res;
};

const obfuscatePatterns = (obj: any, ...patterns: RegExp[]): any => {
  if (typeof obj === 'object') {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      res[key] = obfuscatePatterns(obj[key], ...patterns);
    }
    return res;
  }

  if (Array.isArray(obj)) {
    return obj.map((i) => obfuscatePatterns(i, ...patterns));
  }

  if (typeof obj === 'string') {
    return patterns.reduce((s, pattern) => s.replace(pattern, '<obfuscated>'), obj);
  }

  return obj;
};

describe('ooth-local', () => {
  let onForgotPasswordListener: any;
  let onRequestVerifyListener: any;
  let onRegisterListener: any;
  let userId: string;
  let resetToken: string;
  let verificationToken: string;
  let sendMail: any = () => null;

  beforeAll(async () => {
    mongoServer = new MongodbMemoryServer();
    const connectionString = await mongoServer.getConnectionString();
    const dbName = await mongoServer.getDbName();
    con = await MongoClient.connect(connectionString);
    db = con.db(dbName);
  });

  afterAll(async () => {
    await con.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    app = express();
    app.use(
      session({
        name: 'api-session-id',
        secret: 'x',
        resave: false,
        saveUninitialized: true,
      }),
    );
    oothMongo = new OothMongo(db);
    ooth = new Ooth({
      app,
      backend: oothMongo,
      path: '',
    });
    oothLocal({
      ooth,
      translations: {
        en: require('../i18n/en.json'),
        fr: {
          register: {
            invalid_email: 'french invalid email',
          },
        },
      },
    });
    sendMail = jest.fn();
    emailer({
      ooth,
      from: 'noreply@example.com',
      siteName: 'Example Site',
      sendMail: (...args) => sendMail(...args),
    });
    ooth.on('local', 'register', async (...args) => {
      if (onRegisterListener) {
        onRegisterListener(...args);
      }
    });
    ooth.on('local', 'forgot-password', async (data) => {
      if (onForgotPasswordListener) {
        //Store user id and reset token for follow on test
        userId = data._id;
        resetToken = data.passwordResetToken;
        onForgotPasswordListener(data);
      }
    });
    ooth.on('local', 'generate-verification-token', async (data) => {
      if (onRequestVerifyListener) {
        //Store user id and  verification token for follow on test
        userId = data._id;
        verificationToken = data.verificationToken;
        onRequestVerifyListener(data);
      }
    });
    ooth.registerAfterware(async (res, userId) => {
      if (userId) {
        res.user = ooth.getProfile(await ooth.getUserById(userId));
      }

      return res;
    });
    await startServer();
  });

  afterEach(async () => {
    if (server) {
      await server.close();
    }
    if (db) {
      await db.dropDatabase();
    }
    cookies = '';
  });

  test('fails without email', async () => {
    try {
      await request({
        method: 'POST',
        uri: 'http://localhost:8080/local/register',
        json: true,
      });
    } catch (e) {
      expect(e.response.body).toMatchSnapshot();
      return;
    }
    throw new Error("Didn't fail");
  });

  test('translates', async () => {
    try {
      await request({
        method: 'POST',
        uri: 'http://localhost:8080/local/register',
        headers: {
          'Accept-Language': 'fr',
        },
        json: true,
      });
    } catch (e) {
      expect(e.response.body).toMatchSnapshot();
      return;
    }
    throw new Error("Didn't fail");
  });

  test('fails without password', async () => {
    try {
      await request({
        method: 'POST',
        uri: 'http://localhost:8080/local/register',
        body: {
          email: 'test@example.com',
        },
        json: true,
      });
    } catch (e) {
      expect(e.response.body).toMatchSnapshot();
      return;
    }
    throw new Error("Didn't fail");
  });

  test('fails without valid password', async () => {
    try {
      await request({
        method: 'POST',
        uri: 'http://localhost:8080/local/register',
        body: {
          email: 'test@example.com',
          password: 'xxxxxx',
        },
        json: true,
      });
    } catch (e) {
      expect(e.response.body).toMatchSnapshot();
      return;
    }
    throw new Error("Didn't fail");
  });

  test('can register', async () => {
    onRegisterListener = jest.fn();
    const res = await request({
      method: 'POST',
      uri: 'http://localhost:8080/local/register',
      body: {
        email: 'test@example.com',
        password: 'Asdflba09',
      },
      json: true,
    });
    expect(res).toMatchSnapshot();
    expect(obfuscate(onRegisterListener.mock.calls[0][0], '_id', 'verificationToken')).toMatchSnapshot();
    expect(obfuscatePatterns(sendMail.mock.calls, /token=[\w\d]+/g, /userId=[\w\d]+/g)).toMatchSnapshot();
  });

  describe('after registration', () => {
    beforeEach(async () => {
      await request({
        method: 'POST',
        uri: 'http://localhost:8080/local/register',
        body: {
          email: 'test@example.com',
          password: 'Asdflba09',
        },
        json: true,
      });
      sendMail = jest.fn();
    });

    test('login fails with wrong password', async () => {
      try {
        await request({
          method: 'POST',
          uri: 'http://localhost:8080/local/login',
          body: {
            username: 'test@example.com',
            password: 'Asdflba099',
          },
          json: true,
        });
      } catch (e) {
        expect(e.response.body).toMatchSnapshot();
        return;
      }
      throw new Error("Didn't fail");
    });

    test('can login', async () => {
      const res = await request({
        method: 'POST',
        uri: 'http://localhost:8080/local/login',
        body: {
          username: 'test@example.com',
          password: 'Asdflba09',
        },
        json: true,
      });
      delete res.user._id;
      expect(res).toMatchSnapshot();
    });

    test('can forget password', async () => {
      onForgotPasswordListener = jest.fn();
      await request({
        method: 'POST',
        uri: 'http://localhost:8080/local/forgot-password',
        body: {
          username: 'test@example.com',
        },
        json: true,
      });
      expect(obfuscate(onForgotPasswordListener.mock.calls[0][0], '_id', 'passwordResetToken')).toMatchSnapshot();
      expect(obfuscatePatterns(sendMail.mock.calls, /token=[\w\d]+/g, /userId=[\w\d]+/g)).toMatchSnapshot();
    });

    test('can reset password', async () => {
      onForgotPasswordListener = jest.fn();

      //Store the password reset token and userId so we can use it later
      await request({
        method: 'POST',
        uri: 'http://localhost:8080/local/forgot-password',
        body: {
          username: 'test@example.com',
        },
        json: true,
      });
      sendMail = jest.fn();
      const res = await request({
        method: 'POST',
        uri: 'http://localhost:8080/local/reset-password',
        body: {
          userId,
          token: resetToken,
          newPassword: 'Asdflba10',
        },
        json: true,
      });
      expect(res).toMatchSnapshot();
      expect(obfuscatePatterns(sendMail.mock.calls, /token=[\w\d]+/g, /userId=[\w\d]+/g)).toMatchSnapshot();
    });

    test("can't reset password with invalid token", async () => {
      onForgotPasswordListener = jest.fn();

      //Store the password reset token and userId so we can use it later
      await request({
        method: 'POST',
        uri: 'http://localhost:8080/local/forgot-password',
        body: {
          username: 'test@example.com',
        },
        json: true,
      });
      try {
        await request({
          method: 'POST',
          uri: 'http://localhost:8080/local/reset-password',
          body: {
            userId,
            token: 'wrongtoken',
            newPassword: 'Asdflba10',
          },
          json: true,
        });
      } catch (e) {
        expect(e.response.body).toMatchSnapshot();
        return;
      }
      throw new Error("Didn't fail");
    });

    describe('after login', () => {
      beforeEach(async () => {
        sendMail = jest.fn();
        const res = await request({
          method: 'POST',
          uri: 'http://localhost:8080/local/login',
          body: {
            username: 'test@example.com',
            password: 'Asdflba09',
          },
          json: true,
        });
        ooth.registerSecondaryAuth(
          'foo',
          'bar',
          () => true,
          new Strategy((_req: any, done: any) => done(null, res.user._id)),
        );
      });

      test('can generate verification token', async () => {
        onRequestVerifyListener = jest.fn();
        await request({
          method: 'POST',
          uri: 'http://localhost:8080/local/generate-verification-token',
          json: true,
          headers: {
            Cookie: cookies,
          },
        });
        expect(obfuscate(onRequestVerifyListener.mock.calls[0][0], '_id', 'verificationToken')).toMatchSnapshot();
        expect(obfuscatePatterns(sendMail.mock.calls, /token=[\w\d]+/g, /userId=[\w\d]+/g)).toMatchSnapshot();
      });

      test('can verify user with token', async () => {
        onRequestVerifyListener = jest.fn();
        //Store verification token and userId for later use
        await request({
          method: 'POST',
          uri: 'http://localhost:8080/local/generate-verification-token',
          json: true,
          headers: {
            Cookie: cookies,
          },
        });
        sendMail = jest.fn();
        const res = await request({
          method: 'POST',
          uri: 'http://localhost:8080/local/verify',
          json: true,
          body: {
            userId,
            token: verificationToken,
          },
          headers: {
            Cookie: cookies,
          },
        });
        expect(obfuscate(res, 'user._id')).toMatchSnapshot();
        expect(obfuscatePatterns(sendMail.mock.calls, /token=[\w\d]+/g, /userId=[\w\d]+/g)).toMatchSnapshot();
      });

      test("can't verify user with invalid token", async () => {
        onRequestVerifyListener = jest.fn();
        //Store verification token and userId for later use
        await request({
          method: 'POST',
          uri: 'http://localhost:8080/local/generate-verification-token',
          json: true,
          headers: {
            Cookie: cookies,
          },
        });
        try {
          await request({
            method: 'POST',
            uri: 'http://localhost:8080/local/verify',
            json: true,
            body: {
              userId,
              token: 'wrongtoken',
            },
            headers: {
              Cookie: cookies,
            },
          });
        } catch (e) {
          expect(e.response.body).toMatchSnapshot();
          return;
        }
        throw new Error("Didn't fail");
      });

      test('can set username', async () => {
        const res = await request({
          method: 'POST',
          uri: 'http://localhost:8080/local/set-username',
          body: {
            username: 'heythere12_',
          },
          json: true,
          headers: {
            Cookie: cookies,
          },
        });
        delete res.user._id;
        expect(res).toMatchSnapshot();
      });

      test('can set email', async () => {
        const res = await request({
          method: 'POST',
          uri: 'http://localhost:8080/local/set-email',
          body: {
            email: 'test@example.com',
          },
          json: true,
          headers: {
            Cookie: cookies,
          },
        });
        delete res.user._id;
        expect(res).toMatchSnapshot();
        expect(obfuscatePatterns(sendMail.mock.calls, /token=[\w\d]+/g, /userId=[\w\d]+/g)).toMatchSnapshot();
      });

      test('can change password', async () => {
        const res = await request({
          method: 'POST',
          uri: 'http://localhost:8080/local/change-password',
          body: {
            password: 'Asdflba09',
            newPassword: 'XXAsdflba09',
          },
          json: true,
          headers: {
            Cookie: cookies,
          },
        });
        delete res.user._id;
        expect(res).toMatchSnapshot();
        expect(obfuscatePatterns(sendMail.mock.calls, /token=[\w\d]+/g, /userId=[\w\d]+/g)).toMatchSnapshot();
      });

      test("can't set invalid username", async () => {
        try {
          await request({
            method: 'POST',
            uri: 'http://localhost:8080/local/set-username',
            body: {
              username: 'bl',
            },
            json: true,
            headers: {
              Cookie: cookies,
            },
          });
        } catch (e) {
          expect(e.response.body).toMatchSnapshot();
          return;
        }
        throw new Error("Didn't fail");
      });
    });
  });
});
