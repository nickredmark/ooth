import { Ooth } from 'ooth';
import * as express from 'express';
import * as session from 'express-session';
import * as request from 'request-promise';
import oothProfile from '../src';
import MongodbMemoryServer from 'mongodb-memory-server';
import { MongoClient, ObjectId } from 'mongodb';
import { OothMongo } from 'ooth-mongo';
import oothGuest from 'ooth-guest';

const dbName = 'oothtest';
let client;
let mongoServer;
let con;
let config;
let app;
let server;
let ooth;
let oothMongo;
let oothProfileConfig;
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
      app,
      backend: oothMongo,
      sharedSecret: '',
      standalone: false,
      path: '',
      onLogin: () => null,
      onLogout: () => null,
    });
    oothGuest({ ooth });
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

  test('can set values', async () => {
    const res = await request({
      method: 'POST',
      uri: 'http://localhost:8080/profile/update',
      body: {
        firstName: 'John',
        lastName: 'Smith',
        age: 20,
      },
      headers: {
        Cookie: cookies,
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
        headers: {
          Cookie: cookies,
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
        headers: {
          Cookie: cookies,
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
