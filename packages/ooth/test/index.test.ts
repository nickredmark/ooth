import * as express from 'express';
import { cloneDeep } from 'lodash';
import { Db, MongoClient } from 'mongodb';
import MongodbMemoryServer from 'mongodb-memory-server';
import { OothMongo } from 'ooth-mongo';
import * as request from 'request-promise';

import { Ooth, User } from '../src';
import { Server } from 'http';

const { Strategy } = require('passport-custom');

let mongoServer: MongodbMemoryServer;
let con: MongoClient;
let db: Db;
let app: express.Express;
let server: Server;
let ooth: Ooth;
let oothMongo: OothMongo;

// May require additional time for downloading MongoDB binaries
jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;

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

describe('ooth', () => {
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

  describe('no session', () => {
    beforeEach(() => {
      app = express();
      oothMongo = new OothMongo(db);
      ooth = new Ooth({
        app,
        backend: oothMongo,
        path: '',
        translations: {
          en: require('../i18n/en.json'),
          fr: {
            not_logged: 'French not logged',
          },
        },
      });
      ooth.registerAfterware(async (result: { [key: string]: any }, userId: string | undefined) => {
        if (userId) {
          result.user = ooth.getProfile(await ooth.getUserById(userId));
        }

        return result;
      });
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

      test('can call method', async () => {
        ooth.registerMethod<{ message: string }>('test', 'foo', [], async (body) => body);

        const res = await ooth.callMethod('test', 'foo', 'hello world', null, 'en');
        expect(res).toBe('hello world');
      });

      test('fails with requireLogged', async () => {
        ooth.registerMethod('test', 'foo', [ooth.requireLogged], async () => ({
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
        ooth.registerMethod('test', 'foo', [ooth.requireLogged], async () => ({
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
          await request({
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
          await request({
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
        ooth.registerPrimaryConnect('test', 'login', [], new Strategy((req: any, done: any) => done(null, req.body)));
        ooth.registerProfileFields('test2', 'baz');
        ooth.registerUniqueField('test2', 'bar', 'bar');
        ooth.registerPrimaryConnect('test2', 'login', [], new Strategy((req: any, done: any) => done(null, req.body)));
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
        let user: User;

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
          user = res.body.user;
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

        test('can connect another strategy', async () => {
          ooth.registerSecondaryAuth('bla', 'bla', () => true, new Strategy((_req: any, done: any) => done(null, user._id)));
          const res = await request({
            method: 'POST',
            uri: 'http://localhost:8080/test2/login',
            body: {
              bar: 3,
              baz: 45,
            },
            json: true,
          });
          expect(res.user._id).toBe(user._id);
          expect(obfuscate(res.user, '_id')).toMatchSnapshot();
        });
      });
    });
  });

  describe('session', () => {
    beforeEach(async () => {
      app = express();
      oothMongo = new OothMongo(db);
      ooth = new Ooth({
        app,
        backend: oothMongo,
        path: '',
        sessionSecret: 'secret',
      });
      ooth.registerProfileFields('foo', 'x');
      ooth.registerPrimaryConnect('foo', 'login', [], new Strategy((_req: any, done: any) => done(null, { x: 1 })));
      ooth.registerMethod('foo', 'bar', [ooth.requireLogged], async () => ({ x: 1 }));
      ooth.registerAfterware(async (result: { [key: string]: any }, userId: string | undefined) => {
        if (userId) {
          result.user = ooth.getProfile(await ooth.getUserById(userId));
        }

        return result;
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
    });

    describe('methods', () => {
      test('fails without cookies', async () => {
        try {
          await request({
            method: 'POST',
            uri: 'http://localhost:8080/foo/bar',
            json: true,
          });
        } catch (e) {
          expect(e.response.body).toMatchSnapshot();
          return;
        }
        throw new Error("Didn't throw");
      });

      test('can do secondary auth with cookies', async () => {
        const lres = await request({
          method: 'POST',
          uri: 'http://localhost:8080/foo/login',
          json: true,
          resolveWithFullResponse: true,
        });

        expect(obfuscate(lres.body.user, '_id')).toMatchSnapshot();

        expect(/Expires/.test(lres.headers['set-cookie'])).toBe(false);

        const res = await request({
          method: 'POST',
          uri: 'http://localhost:8080/foo/bar',
          headers: {
            Cookie: lres.headers['set-cookie'],
          },
          json: true,
        });

        expect(obfuscate(res.user, '_id')).toMatchSnapshot();
      });

      test('remember', async () => {
        const lres = await request({
          method: 'POST',
          uri: 'http://localhost:8080/foo/login',
          json: true,
          body: { remember: true },
          resolveWithFullResponse: true,
        });

        expect(/Expires/.test(lres.headers['set-cookie'])).toBe(true);
      });

      test('can log out', async () => {
        const lres = await request({
          method: 'POST',
          uri: 'http://localhost:8080/foo/login',
          json: true,
          resolveWithFullResponse: true,
        });

        expect(obfuscate(lres.body.user, '_id')).toMatchSnapshot();

        const reslogout = await request({
          method: 'POST',
          uri: 'http://localhost:8080/session/logout',
          headers: {
            Cookie: lres.headers['set-cookie'],
          },
          json: true,
        });

        expect(reslogout).toMatchSnapshot();

        try {
          await request({
            method: 'POST',
            uri: 'http://localhost:8080/foo/bar',
            headers: {
              Cookie: lres.headers['set-cookie'],
            },
            json: true,
          });
        } catch (e) {
          expect(e.response.body).toMatchSnapshot();
          return;
        }
        throw new Error("Didn't throw");
      });
    });
  });
});
