import * as express from 'express';
import * as session from 'express-session';
import { MongoClient, Db } from 'mongodb';
import MongodbMemoryServer from 'mongodb-memory-server';
import { Ooth } from 'ooth';
import { OothMongo } from 'ooth-mongo';
import * as request from 'request-promise';

import oothUser from '../src';
import { Server } from 'http';

const { Strategy } = require('passport-custom');

let mongoServer: MongodbMemoryServer;
let con: MongoClient;
let app: express.Express;
let server: Server;
let ooth: Ooth;
let oothMongo: OothMongo;
let db: Db;
let cookies = '';

const startServer = () =>
  new Promise((resolve) => {
    server = app.listen(8080, resolve);
  });

const obfuscate = (obj: any, ...keys: string[]) => {
  const res: any = {};
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
    });
    oothUser({
      ooth,
    });
    ooth.registerProfileFields('guest', 'x');
    ooth.registerPrimaryConnect('guest', 'register', [], new Strategy((_: any, done: any) => done(null, { x: 1 })));
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
