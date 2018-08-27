import { Ooth } from 'ooth';
import * as express from 'express';
import * as request from 'request-promise';
import oothRoles from '../src';
import MongodbMemoryServer from 'mongodb-memory-server';
import { MongoClient, ObjectId } from 'mongodb';
import { OothMongo } from 'ooth-mongo';
import { Strategy } from 'passport-custom';

let mongoServer;
let con;
let app;
let server;
let ooth;
let oothMongo;
let db;
let admin;
let user;

const startServer = () => {
  return new Promise((resolve) => {
    server = app.listen(8080, resolve());
  });
};

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
      onLogin: () => null,
    });
    oothRoles({ ooth });
    ooth.registerPrimaryConnect('guest', 'register', [], new Strategy((req, done) => done(null, {})));
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
        _id: ObjectId(admin._id),
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
    ooth.registerSecondaryAuth('foo', 'bar', () => true, new Strategy((req, done) => done(null, admin._id)));
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
      ooth.registerSecondaryAuth('foo', 'bar', () => true, new Strategy((req, done) => done(null, user._id)));
      const res = await request({
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
