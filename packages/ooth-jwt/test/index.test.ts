import * as express from 'express';
import { MongoClient } from 'mongodb';
import MongodbMemoryServer from 'mongodb-memory-server';
import { Ooth } from 'ooth';
import oothGuest from 'ooth-guest';
import { OothMongo } from 'ooth-mongo';
import * as request from 'request-promise';
import { Strategy } from 'passport-custom';
import { decode } from 'jsonwebtoken';
import * as lolex from 'lolex';

import { default as oothJwt, getToken } from '../src';

let mongoServer;
let con;
let app;
let server;
let ooth: Ooth;
let oothMongo;
let db;

const startServer = () =>
  new Promise((resolve) => {
    server = app.listen(8080, resolve);
  });

const obfuscate = (obj, ...keys) => {
  const res = {};
  for (const key of Object.keys(obj)) {
    if (keys.indexOf(key) > -1) {
      res[key] = '<obfuscated>';
    } else {
      res[key] = obj[key];
    }
  }

  return res;
};

describe('ooth-user', () => {
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
    oothMongo = new OothMongo(db);
    ooth = new Ooth({
      app,
      backend: oothMongo,
      path: '',
      onLogin: () => null,
    });
    oothGuest({ ooth });
    oothJwt({
      ooth,
      sharedSecret: 'secret',
    });
    ooth.registerProfileFields('foo', 'a');
    ooth.registerPrimaryConnect('foo', 'bar', [], new Strategy((req, done) => done(null, { a: 'b' })));
    ooth.registerPrimaryConnect('foo', 'fail', [], new Strategy((req, done) => done(new Error('nope'))));
    ooth.registerPrimaryConnect('foo', 'logout', [], new Strategy((req, done) => done(null, undefined)));
    ooth.registerMethod('foo', 'restricted', [ooth.requireLogged], async (params, userId) => ({
      user: await ooth.getUserById(userId),
    }));
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

  test('attaches jwt and refresh token to auth response', async () => {
    const res = await request({
      method: 'POST',
      uri: 'http://localhost:8080/foo/bar',
      json: true,
    });
    expect(Object.keys(res)).toMatchSnapshot();
    expect(Object.keys(decode(res.token, 'secret'))).toMatchSnapshot();
  });

  describe('after getting jwt', () => {
    let token;
    let refreshToken;
    let decodedToken;
    let clock;

    beforeEach(async () => {
      clock = lolex.install();
      const res = await request({
        method: 'POST',
        uri: 'http://localhost:8080/foo/bar',
        json: true,
      });
      token = res.token;
      decodedToken = decode(token, 'secret') as { [key: string]: any };
      refreshToken = res.refreshToken;
    });

    afterEach(() => {
      clock.uninstall();
    });

    test('can log in with jwt', async () => {
      clock.tick(1000 * 60 * 59);
      const res = await request({
        method: 'POST',
        uri: 'http://localhost:8080/foo/restricted',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        json: true,
      });
      expect(Object.keys(res.user)).toMatchSnapshot();
    });

    test('cannot log in with expired jwt', async () => {
      clock.tick(1000 * 60 * 61);
      try {
        //        let expiredToken = getToken(decodedToken._id, new Date().getTime() / 1000 - 60 * 61, 60 * 60, 'secret');
        await request({
          method: 'POST',
          uri: 'http://localhost:8080/foo/restricted',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          json: true,
        });
      } catch (e) {
        expect(e.response.body).toMatchSnapshot();
        return;
      }
      throw new Error("Didn't fail");
    });

    // prevent user to refresh jwt with a jwt
    test('cannot bypass primary auth returning error with secondary auth', async () => {
      try {
        const res = await request({
          method: 'POST',
          uri: 'http://localhost:8080/foo/fail',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          json: true,
        });
      } catch (e) {
        expect(e.response.body).toMatchSnapshot();
        return;
      }
      throw new Error("Didn't fail");
    });

    // prevent user to refresh jwt with a jwt
    test('cannot bypass primary auth returning undefined user with secondary auth', async () => {
      const res = await request({
        method: 'POST',
        uri: 'http://localhost:8080/foo/logout',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        json: true,
      });
      expect(res).toMatchSnapshot();
    });

    test('can reauth with refresh token', async () => {
      const res = await request({
        method: 'POST',
        uri: 'http://localhost:8080/jwt/refresh',
        body: {
          refreshToken,
          userId: decodedToken._id,
        },
        json: true,
      });
      expect(Object.keys(res)).toMatchSnapshot();
      expect(Object.keys(decode(res.token, 'secret'))).toMatchSnapshot();
    });

    test('refreshtoken expires', async () => {
      clock.tick(1000 * 60 * 60 * 25);
      try {
        const res = await request({
          method: 'POST',
          uri: 'http://localhost:8080/jwt/refresh',
          body: {
            refreshToken,
            userId: decodedToken._id,
          },
          json: true,
        });
      } catch (e) {
        expect(e.response.body).toMatchSnapshot();
        return;
      }
      throw new Error("Didn't fail");
    });
  });
});
