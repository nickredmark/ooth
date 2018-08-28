import * as express from 'express';
import { MongoClient } from 'mongodb';
import MongodbMemoryServer from 'mongodb-memory-server';
import { Ooth } from 'ooth';
import { OothMongo } from 'ooth-mongo';
import * as request from 'request-promise';
import { Strategy } from 'passport-custom';

import oothProfile from '../src';

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

describe('ooth-profile', () => {
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
    oothProfile({
      ooth,
      fields: {
        firstName: {},
        lastName: {},
        age: {
          validate(value, user) {
            if (Number.isNaN(value)) {
              throw new Error(`Age is not a number: ${value}.`);
            }
            if (value < 0 || value > 150) {
              throw new Error(`Age out of bounds ${value}.`);
            }
          },
        },
      },
    });
    ooth.registerPrimaryConnect('guest', 'register', [], new Strategy((req, done) => done(null, {})));
    ooth.registerAfterware(async (res, userId) => {
      if (userId) {
        res.user = await ooth.getUserById(userId);
      }

      return res;
    });
    await startServer();
    const res = await request({
      method: 'POST',
      uri: 'http://localhost:8080/guest/register',
      json: true,
    });
    ooth.registerSecondaryAuth('foo', 'bar', () => true, new Strategy((req, done) => done(null, res.user._id)));
  });

  afterEach(async () => {
    if (server) {
      await server.close();
    }
    if (db) {
      await db.dropDatabase();
    }
  });

  test('can set values', async () => {
    const res = await request({
      method: 'POST',
      uri: 'http://localhost:8080/profile/update',
      body: {
        firstName: 'John',
        lastName: 'Smith',
        age: 20,
      },
      json: true,
    });
    expect(obfuscate(res.user, '_id')).toMatchSnapshot();
  });

  test('should fail with invalid field', async () => {
    try {
      await request({
        method: 'POST',
        uri: 'http://localhost:8080/profile/update',
        body: {
          foo: 'bar',
        },
        json: true,
      });
    } catch (e) {
      expect(e.response.body).toMatchSnapshot();
      return;
    }
    throw new Error("Didn't fail");
  });

  test('should fail with invalid value', async () => {
    try {
      await request({
        method: 'POST',
        uri: 'http://localhost:8080/profile/update',
        body: {
          age: -1,
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
