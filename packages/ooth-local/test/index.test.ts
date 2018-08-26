import * as express from 'express';
import * as session from 'express-session';
import { cloneDeep } from 'lodash';
import { MongoClient } from 'mongodb';
import MongodbMemoryServer from 'mongodb-memory-server';
import { Ooth } from 'ooth';
import { OothMongo } from 'ooth-mongo';
import * as request from 'request-promise';

import oothLocal from '../src';

let mongoServer;
let con;
let app;
let server;
let ooth: Ooth;
let db;
let cookies = '';
let oothMongo: OothMongo;

const startServer = () => {
  return new Promise((resolve) => {
    server = app.listen(8080, resolve());
  });
};

const obfuscate = (obj, ...paths) => {
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

describe('ooth-local', () => {
  let onForgotPasswordListener;
  let onRequestVerifyListener;
  let onRegisterListener;
  let userId;
  let resetToken;
  let verificationToken;

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
      sharedSecret: '',
      standalone: false,
      path: '',
      onLogin: () => null,
      onLogout: () => null,
    });
    oothLocal({
      ooth,
      onRegister(...args) {
        if (onRegisterListener) {
          onRegisterListener(...args);
        }
      },
      onForgotPassword(data) {
        if (onForgotPasswordListener) {
          //Store user id and reset token for follow on test
          userId = data._id;
          resetToken = data.passwordResetToken;
          onForgotPasswordListener(data);
        }
      },
      onGenerateVerificationToken(data) {
        if (onRequestVerifyListener) {
          //Store user id and  verification token for follow on test
          userId = data._id;
          verificationToken = data.verificationToken;
          onRequestVerifyListener(data);
        }
      },
      translations: {
        en: require('../i18n/en.json'),
        fr: {
          register: {
            invalid_email: 'french invalid email',
          },
        },
      },
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

  test('can check status', async () => {
    const res = await request({
      uri: 'http://localhost:8080/status',
      json: true,
    });
    expect(res).toMatchSnapshot();
  });

  test('fails without email', async () => {
    try {
      const res = await request({
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
      const res = await request({
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
      const res = await request({
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
      const res = await request({
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
    });

    test('login fails with wrong password', async () => {
      try {
        const res = await request({
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
      const res = await request({
        method: 'POST',
        uri: 'http://localhost:8080/local/forgot-password',
        body: {
          username: 'test@example.com',
        },
        json: true,
      });
      expect(obfuscate(onForgotPasswordListener.mock.calls[0][0], '_id', 'passwordResetToken')).toMatchSnapshot();
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
        const res = await request({
          method: 'POST',
          uri: 'http://localhost:8080/local/login',
          body: {
            username: 'test@example.com',
            password: 'Asdflba09',
          },
          json: true,
          resolveWithFullResponse: true,
        });
        cookies = res.headers['set-cookie'];
      });

      test('can generate verification token', async () => {
        onRequestVerifyListener = jest.fn();
        const res = await request({
          method: 'POST',
          uri: 'http://localhost:8080/local/generate-verification-token',
          json: true,
          headers: {
            Cookie: cookies,
          },
        });
        expect(obfuscate(onRequestVerifyListener.mock.calls[0][0], '_id', 'verificationToken')).toMatchSnapshot();
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

      test('can check status', async () => {
        const res = await request({
          uri: 'http://localhost:8080/status',
          json: true,
          headers: {
            Cookie: cookies,
          },
        });
        delete res.user._id;
        expect(res).toMatchSnapshot();
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
