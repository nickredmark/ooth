import * as express from 'express';
import { MongoClient, Db } from 'mongodb';
import MongodbMemoryServer from 'mongodb-memory-server';
import { Ooth } from 'ooth';
import { OothMongo } from 'ooth-mongo';
import * as request from 'request-promise';

import oothFacebook from '../src';
import { Server } from 'http';

let mongoServer: MongodbMemoryServer;
let con: MongoClient;
let app: express.Express;
let server: Server;
let ooth: Ooth;
let oothMongo: OothMongo;
let db: Db;

const startServer = () => {
  return new Promise((resolve) => {
    server = app.listen(8080, resolve);
  });
};

describe('ooth-facebook', () => {
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
    oothFacebook({
      ooth,
      clientID: 'XXX',
      clientSecret: 'XXX',
    });
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

  test('fails to log in with valid token', async () => {
    try {
      await request({
        method: 'POST',
        uri: 'http://localhost:8080/facebook/login',
        json: true,
        body: {
          access_token: 'XXX',
        },
      });
    } catch (e) {
      expect(e.response.statusCode).toBe(400);
      expect(e.response.body).toMatchSnapshot();
    }
  });
});
