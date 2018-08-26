import * as express from 'express';
import * as session from 'express-session';
import { cloneDeep } from 'lodash';
import { MongoClient } from 'mongodb';
import MongodbMemoryServer from 'mongodb-memory-server';
import { OothMongo } from 'ooth-mongo';
import * as CustomStrategy from 'passport-custom';
import * as request from 'request-promise';

import { Ooth } from '../src';

let mongoServer;
let con;
let db;
let config;
let app;
let server;
let ooth: Ooth;
let oothMongo: OothMongo;

// May require additional time for downloading MongoDB binaries
jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;

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

describe('ooth', () => {
  let onRegister = () => null;
  let onLogin = () => null;
  let onLogout = () => null;

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

  beforeEach(() => {
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
    config = {
      app,
      backend: oothMongo,
      sharedSecret: '',
      standalone: false,
      path: '',
      onLogin: () => onLogin(),
      onLogout: () => onLogout(),
      onRegister: () => onRegister(),
      translations: {
        en: require('../i18n/en.json'),
        fr: {
          not_logged: 'French not logged',
        },
      },
    };
    ooth = new Ooth(config);
  });

  afterEach(async () => {
    if (server) {
      await server.close();
    }
    if (db) {
      await db.dropDatabase();
    }
  });

  describe('methods', () => {
    test('handle method', async () => {
      ooth.registerMethod<{ message: string }>('test', 'foo', [], async () => ({
        message: 'hi',
      }));

      await startServer();
      const res = await request({
        method: 'POST',
        uri: 'http://localhost:8080/test/foo',
        json: true,
      });
      expect(res).toMatchSnapshot();
    });

    test('fails with requireLogged', async () => {
      ooth.registerMethod('test', 'foo', [ooth.requireLogged], async (req, res) => ({
        message: 'hi',
      }));

      await startServer();
      try {
        await request({
          method: 'POST',
          uri: 'http://localhost:8080/test/foo',
          json: true,
        });
      } catch (e) {
        expect(e.response.body).toMatchSnapshot();
        return;
      }
      throw new Error("Didn't fail");
    });

    test('translates error', async () => {
      ooth.registerMethod('test', 'foo', [ooth.requireLogged], async (req, res) => ({
        message: 'hi',
      }));

      await startServer();
      try {
        await request({
          method: 'POST',
          uri: 'http://localhost:8080/test/foo',
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

    test('handle errors', async () => {
      ooth.registerMethod('test', 'foo', [], () => {
        throw new Error('Error message.');
      });

      await startServer();
      try {
        const res = await request({
          method: 'POST',
          uri: 'http://localhost:8080/test/foo',
          json: true,
        });
        expect(false);
      } catch (e) {
        expect(e.response.body).toMatchSnapshot();
      }
    });

    test('handle async errors', async () => {
      ooth.registerMethod('test', 'foo', [], async () =>
        Promise.resolve().then(() => {
          throw new Error('Error message.');
        }),
      );

      await startServer();
      try {
        const res = await request({
          method: 'POST',
          uri: 'http://localhost:8080/test/foo',
          json: true,
        });
        expect(false);
      } catch (e) {
        expect(e.response.body).toMatchSnapshot();
      }
    });
  });

  describe('connect method', () => {
    beforeEach(async () => {
      ooth.registerProfileFields('test', 'foo');
      ooth.registerUniqueField('test', 'bar', 'bar');
      ooth.registerPassportConnectMethod('test', 'login', [], new CustomStrategy((req, done) => done(null, req.body)));
      ooth.registerProfileFields('test2', 'baz');
      ooth.registerUniqueField('test2', 'bar', 'bar');
      ooth.registerPassportConnectMethod('test2', 'login', [], new CustomStrategy((req, done) => done(null, req.body)));
      await startServer();
    });

    test('can register', async () => {
      const res = await request({
        method: 'POST',
        uri: 'http://localhost:8080/test/login',
        body: {
          foo: 1,
          bar: 2,
        },
        json: true,
      });
      expect(obfuscate(res.user, '_id')).toMatchSnapshot();
    });

    test('can log in', async () => {
      const res = await request({
        method: 'POST',
        uri: 'http://localhost:8080/test/login',
        body: {
          foo: 1,
          bar: 2,
        },
        json: true,
      });
      expect(obfuscate(res, 'user._id')).toMatchSnapshot();
    });

    describe('after login', () => {
      let cookies;
      let user;

      beforeEach(async () => {
        const res = await request({
          method: 'POST',
          uri: 'http://localhost:8080/test/login',
          body: {
            foo: 1,
            bar: 2,
          },
          json: true,
          resolveWithFullResponse: true,
        });
        cookies = res.headers['set-cookie'];
        user = res.body.user;
      });

      test('can log out', async () => {
        const res = await request({
          method: 'POST',
          uri: 'http://localhost:8080/logout',
          json: true,
          headers: {
            Cookie: cookies,
          },
        });
        expect(res).toMatchSnapshot();
      });

      test('can log in again', async () => {
        const res = await request({
          method: 'POST',
          uri: 'http://localhost:8080/test/login',
          body: {
            foo: 2,
            bar: 2,
          },
          json: true,
        });
        expect(res.user._id).toBe(user._id);
        expect(obfuscate(res.user, '_id')).toMatchSnapshot();
      });

      test('can log in with other strategy', async () => {
        const res = await request({
          method: 'POST',
          uri: 'http://localhost:8080/test2/login',
          body: {
            foo: 2,
            bar: 2,
          },
          json: true,
        });
        expect(res.user._id).toBe(user._id);
        expect(obfuscate(res.user, '_id')).toMatchSnapshot();
      });

      test('can log in with other strategy', async () => {
        const res = await request({
          method: 'POST',
          uri: 'http://localhost:8080/test2/login',
          body: {
            foo: 2,
            bar: 2,
          },
          json: true,
        });
        expect(res.user._id).toBe(user._id);
        expect(obfuscate(res.user, '_id')).toMatchSnapshot();
      });

      test('can connect another strategy', async () => {
        const res = await request({
          method: 'POST',
          uri: 'http://localhost:8080/test2/login',
          body: {
            bar: 3,
          },
          json: true,
          headers: {
            Cookie: cookies,
          },
        });
        expect(res.user._id).toBe(user._id);
        expect(obfuscate(res.user, '_id')).toMatchSnapshot();
      });
    });
  });
});
