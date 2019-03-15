require('dotenv').config({ path: './.env.test' });
import { cloneDeep } from 'lodash';
import { OothPrisma } from '../src';
const { Prisma } = require('../generated/prisma-client');

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

let prisma = new Prisma();
let oothPrisma = new OothPrisma(prisma);

describe('ooth-prisma', () => {
  beforeAll(async () => {
    // prisma = new Prisma();
    // oothPrisma = new OothPrisma(prisma);
    // mongoServer = new MongodbMemoryServer({ debug: true });
    // const connectionString = await mongoServer.getConnectionString();
    // const dbName = await mongoServer.getDbName();
    // con = await MongoClient.connect(connectionString);
    // db = await con.db(dbName);
    // await db.dropDatabase();
    // oothMongo = new OothMongo(db);
  });

  afterAll(async () => {
    // await con.close();
    // await mongoServer.stop();
  });

  afterEach(async () => {
    // await db.dropDatabase(); 
  });

  test('can insert user and get it', async () => {
    const id = await oothPrisma.insertUser({
      foo: {
        baz: 'bar',
      },
    });
    expect(typeof id).toBe('string');
    const user = await oothPrisma.getUserById(id);
    expect(obfuscate(user, '_id')).toMatchSnapshot();
  });

  test('can get user by id', async () => {
    const id = 'cjt9zfyk101o40744agd5mwa8';
    const user = await oothPrisma.getUserById(id);
    console.log(user);
    expect(obfuscate(user, '_id')).toMatchSnapshot();  
  });

});
