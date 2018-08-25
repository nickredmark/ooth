import { Ooth } from 'ooth';
import * as express from 'express';
import * as session from 'express-session';
import * as request from 'request-promise';
import oothRoles from '../src';
import MongodbMemoryServer from 'mongodb-memory-server';
import { MongoClient, ObjectId } from 'mongodb';
import { OothMongo } from 'ooth-mongo';
import oothGuest from 'ooth-guest';

let mongoServer;
let con;
let app;
let server;
let ooth;
let oothMongo;
let db;
let admin;
let adminCookies = '';
let user;
let userCookies = '';

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
    oothRoles({ ooth });
    await startServer();
    let res = await request({
      method: 'POST',
      uri: 'http://localhost:8080/guest/register',
      resolveWithFullResponse: true,
      json: true,
    });
    adminCookies = res.headers['set-cookie'];
    admin = res.body.user;

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
      resolveWithFullResponse: true,
      json: true,
    });
    userCookies = res.headers['set-cookie'];
    user = res.body.user;
  });

  afterEach(async () => {
    if (server) {
      await server.close();
    }
    if (db) {
      await db.dropDatabase();
    }
    adminCookies = '';
  });

  test('admin can set roles', async () => {
    const res = await request({
      method: 'POST',
      uri: 'http://localhost:8080/roles/set',
      body: {
        userId: admin._id,
        roles: ['admin', 'editor'],
      },
      headers: {
        Cookie: adminCookies,
      },
      json: true,
    });

    expect(obfuscate(res.user, '_id')).toMatchSnapshot();
  });

  test("nonadmin can't set roles", async () => {
    try {
      const res = await request({
        method: 'POST',
        uri: 'http://localhost:8080/roles/set',
        body: {
          userId: user._id,
          roles: ['admin', 'editor'],
        },
        headers: {
          Cookie: userCookies,
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
