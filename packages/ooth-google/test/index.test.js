import { Ooth } from 'ooth';
import { OothMongo } from 'ooth-mongo';
import express from 'express';
import session from 'express-session';
import request from 'request-promise';
import oothGoogle from '../src';
import { MongoClient, ObjectId } from 'mongodb';

let mongoUrl = 'mongodb://localhost:27017/oothtest';
let config;
let app;
let server;
let ooth;
let oothMongo;
let oothGoogleConfig;
let db;
let cookies = '';

const startServer = () => {
  return new Promise((resolve) => {
    server = app.listen(8080, resolve());
  });
};

describe('ooth-google', () => {
  beforeAll(async () => {
    db = await MongoClient.connect(mongoUrl);
    await db.dropDatabase();
  });

  afterAll(async () => {
    await db.close();
  });

  beforeEach(async () => {
    config = {
      mongoUrl,
      sharedSecret: '',
      standalone: false,
      path: '',
      onLogin: () => null,
      onLogout: () => null,
    };
    oothGoogleConfig = {
      clientID: 'XXX',
      clientSecret: 'XXX',
    };
    app = express();
    app.use(
      session({
        name: 'api-session-id',
        secret: 'x',
        resave: false,
        saveUninitialized: true,
      }),
    );
    ooth = new Ooth(config);
    ooth.use('google', oothGoogle(oothGoogleConfig));
    oothMongo = new OothMongo(db, ObjectId);
    await ooth.start(app, oothMongo);
    await startServer(app);
  });

  afterEach(async () => {
    await server.close();
    await db.dropDatabase();
    cookies = '';
  });

  test('registers routes', async () => {
    const res = await request({
      uri: 'http://localhost:8080/',
      json: true,
    });
    expect(res.methods.google).toMatchSnapshot();
  });

  test('fails to log in with valid token', async () => {
    try {
      const res = await request({
        method: 'POST',
        uri: 'http://localhost:8080/google/login',
        json: true,
        body: {
          id_token: 'XXX',
        },
      });
    } catch (e) {
      expect(e.response.statusCode).toBe(400);
      expect(e.response.body).toMatchSnapshot();
    }
  });
});
