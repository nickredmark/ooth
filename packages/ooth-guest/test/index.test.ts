import * as express from 'express';
import { MongoClient, Db } from 'mongodb';
import MongodbMemoryServer from 'mongodb-memory-server';
import { Ooth } from 'ooth';
import { OothMongo } from 'ooth-mongo';
import * as request from 'request-promise';

import oothGuest from '../src';
import { Server } from 'http';

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

describe('ooth-guest', () => {
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
    oothGuest({
      ooth,
    });
    ooth.registerAfterware(async (res, user) => ((res.user = await ooth.getUserById(user!)), res));
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

  test('can register', async () => {
    const res = await request({
      method: 'POST',
      uri: 'http://localhost:8080/guest/register',
      json: true,
    });

    expect(obfuscate(res.user, '_id')).toMatchSnapshot();
  });
});
