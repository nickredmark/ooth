import * as express from 'express';
import { decode } from 'jsonwebtoken';
import * as lolex from 'lolex';
import { MongoClient, Db } from 'mongodb';
import MongodbMemoryServer from 'mongodb-memory-server';
import { Ooth } from 'ooth';
import oothGuest from 'ooth-guest';
import { OothMongo } from 'ooth-mongo';
import * as request from 'request-promise';

import oothJwt from '../src';
import { Server } from 'http';

const { Strategy } = require('passport-custom');

let mongoServer: MongodbMemoryServer;
let con: MongoClient;
let app: express.Express;
let server: Server;
let ooth: Ooth;
let oothMongo: OothMongo;
let db: Db;

const startServer = () =>
  new Promise((resolve) => {
    server = app.listen(8080, resolve);
  });

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
    });
    oothGuest({ ooth });
    oothJwt({
      ooth,
      sharedSecret: 'secret',
      tokenLocation: 'header'
    });
    ooth.registerProfileFields('foo', 'a');
    ooth.registerPrimaryConnect('foo', 'bar', [], new Strategy((_req: any, done: any) => done(null, { a: 'b' })));
    ooth.registerPrimaryConnect('foo', 'fail', [], new Strategy((_req: any, done: any) => done(new Error('nope'))));
    ooth.registerPrimaryConnect('foo', 'logout', [], new Strategy((_req: any, done: any) => done(null, undefined)));
    ooth.registerMethod('foo', 'restricted', [ooth.requireLogged], async (_params: any, userId: any) => ({
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
    expect(Object.keys(decode(res.token, 'secret' as any) as any)).toMatchSnapshot();
  });

  describe('after getting jwt', () => {
    let token: string;
    let refreshToken: string;
    let decodedToken: { [key: string]: any };
    let clock: any;

    beforeEach(async () => {
      clock = lolex.install();
      const res = await request({
        method: 'POST',
        uri: 'http://localhost:8080/foo/bar',
        json: true,
      });
      token = res.token;
      decodedToken = decode(token, 'secret' as any) as { [key: string]: any };
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
          Authorization: `JWT ${token}`,
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
            Authorization: `JWT ${token}`,
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
        await request({
          method: 'POST',
          uri: 'http://localhost:8080/foo/fail',
          headers: {
            Authorization: `JWT ${token}`,
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
          Authorization: `JWT ${token}`,
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
      expect(Object.keys(decode(res.token, 'secret' as any) as any)).toMatchSnapshot();
    });

    test('refreshtoken expires', async () => {
      clock.tick(1000 * 60 * 60 * 25);
      try {
        await request({
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
