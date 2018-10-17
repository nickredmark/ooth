import * as express from 'express';
import { MongoClient, ObjectId, Db } from 'mongodb';
import MongodbMemoryServer from 'mongodb-memory-server';
import { Ooth } from 'ooth';
import { OothMongo } from 'ooth-mongo';
import * as request from 'request-promise';

import oothRoles from '../src';
import { Server } from 'http';

const { Strategy } = require('passport-custom');

let mongoServer: MongodbMemoryServer;
let con: MongoClient;
let app: express.Express;
let server: Server;
let ooth: Ooth;
let oothMongo: OothMongo;
let db: Db;
let admin: any;
let user: any;

const startServer = () => {
  return new Promise((resolve) => {
    server = app.listen(8080, resolve);
  });
};

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

describe('ooth-roles', () => {
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
    oothRoles({ ooth });
    ooth.registerPrimaryConnect('guest', 'register', [], new Strategy((_req: any, done: any) => done(null, {})));
    ooth.registerAfterware(async (res, userId) => {
      if (userId) {
        res.user = await ooth.getUserById(userId);
      }

      return res;
    });
    await startServer();
    let res = await request({
      method: 'POST',
      uri: 'http://localhost:8080/guest/register',
      json: true,
    });
    admin = res.user;

    db.collection('users').update(
      {
        _id: new ObjectId(admin._id),
      },
      {
        $set: {
          roles: {
            roles: ['admin'],
          },
        },
      },
    );

    res = await request({
      method: 'POST',
      uri: 'http://localhost:8080/guest/register',
      json: true,
    });
    user = res.user;
  });

  afterEach(async () => {
    if (server) {
      await server.close();
    }
    if (db) {
      await db.dropDatabase();
    }
  });

  test('admin can set roles', async () => {
    ooth.registerSecondaryAuth('foo', 'bar', () => true, new Strategy((_req: any, done: any) => done(null, admin._id)));
    const res = await request({
      method: 'POST',
      uri: 'http://localhost:8080/roles/set',
      body: {
        userId: admin._id,
        roles: ['admin', 'editor'],
      },
      json: true,
    });

    expect(obfuscate(res.user, '_id')).toMatchSnapshot();
  });

  test("nonadmin can't set roles", async () => {
    try {
      ooth.registerSecondaryAuth('foo', 'bar', () => true, new Strategy((_req: any, done: any) => done(null, user._id)));
      await request({
        method: 'POST',
        uri: 'http://localhost:8080/roles/set',
        body: {
          userId: user._id,
          roles: ['admin', 'editor'],
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
