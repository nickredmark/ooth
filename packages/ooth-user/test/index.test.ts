import * as express from 'express';
import * as session from 'express-session';
import { MongoClient } from 'mongodb';
import MongodbMemoryServer from 'mongodb-memory-server';
import { Ooth } from 'ooth';
import { OothMongo } from 'ooth-mongo';
import * as request from 'request-promise';
import { Strategy } from 'passport-custom';

import oothUser from '../src';

let mongoServer;
let con;
let app;
let server;
let ooth: Ooth;
let oothMongo;
let db;
let cookies = '';

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
      sessionSecret: 'bla',
      app,
      backend: oothMongo,
      path: '',
      onLogin: () => null,
      onLogout: () => null,
    });
    oothUser({
      ooth,
    });
    ooth.registerProfileFields('guest', 'x');
    ooth.registerPrimaryConnect('guest', 'register', [], new Strategy((_, done) => done(null, { x: 1 })));
    await startServer();

    const res = await request({
      method: 'POST',
      uri: 'http://localhost:8080/guest/register',
      resolveWithFullResponse: true,
    });
    cookies = res.headers['set-cookie'];
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

  test('attaches user object to response', async () => {
    const res = await request({
      method: 'POST',
      uri: 'http://localhost:8080/user/user',
      headers: {
        Cookie: cookies,
      },
      json: true,
    });
    expect(obfuscate(res.user, '_id')).toMatchSnapshot();
  });
});
