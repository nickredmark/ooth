import { cloneDeep } from 'lodash';
import { MongoClient, Db } from 'mongodb';
import MongodbMemoryServer from 'mongodb-memory-server';

import { OothMongo } from '../src';

let mongoServer: MongodbMemoryServer;
let con: MongoClient;
let oothMongo: OothMongo;
let db: Db;

// May require additional time for downloading MongoDB binaries
jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;

const obfuscate = (obj: any, ...paths: string[]) => {
  const res = cloneDeep(obj);
  for (const path of paths) {
    const keys = path.split('.');
    let current = res;
    for (const key of keys.slice(0, -1)) {
      current = current[key];
    }
    current[keys[keys.length - 1]] = '<obfuscated>';
  }

  return res;
};

describe('ooth-mongo', () => {
  beforeAll(async () => {
    mongoServer = new MongodbMemoryServer({ debug: true });
    const connectionString = await mongoServer.getConnectionString();
    const dbName = await mongoServer.getDbName();
    con = await MongoClient.connect(connectionString);
    db = await con.db(dbName);
    await db.dropDatabase();
    oothMongo = new OothMongo(db);
  });

  afterAll(async () => {
    await con.close();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await db.dropDatabase();
  });

  test('can insert user and get it', async () => {
    const id = await oothMongo.insertUser({
      foo: {
        baz: 'bar',
      },
    });
    expect(typeof id).toBe('string');
    const user = await oothMongo.getUserById(id);
    expect(obfuscate(user, '_id')).toMatchSnapshot();
  });

  test('can update user', async () => {
    const id = await oothMongo.insertUser({});
    await oothMongo.updateUser(id, {
      foo: 'bar',
    });
    const user = await oothMongo.getUserById(id);
    expect(obfuscate(user, '_id')).toMatchSnapshot();
  });

  test('can get user by value', async () => {
    await oothMongo.insertUser({
      foo: {
        bar: 'baz',
      },
      foo2: {
        bar2: 'baz2',
      },
    });
    const user = await oothMongo.getUserByValue(['foo.bar', 'foo2.bar2'], 'baz2');
    expect(obfuscate(user, '_id')).toMatchSnapshot();
  });

  test('can get user by fields', async () => {
    await oothMongo.insertUser({
      foo: {
        bar: 'baz',
      },
      foo2: {
        bar2: 'baz2',
      },
    });
    const user = await oothMongo.getUser({
      'foo.bar': 'baz',
      'foo2.bar2': 'baz2',
    });
    expect(obfuscate(user, '_id')).toMatchSnapshot();
  });
});
