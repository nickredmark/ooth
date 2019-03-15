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

let prisma: any = {};
let oothPrisma: any = {};


describe('ooth-prisma', () => {
  beforeAll(async () => {
    prisma = new Prisma();
    oothPrisma = new OothPrisma(prisma); 
  });

  afterAll(async () => {

  });

  afterEach(async () => {

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

  test.skip('can update user', async () => {
    const id = await oothPrisma.insertUser({
      foo: {
        baz: 'bar',
      },
    });
    await oothPrisma.updateUser(id, {
      foo: {
        baz: 'bar',
        baz2: 'bar2',
      },
      foo2: {
        baz: 'bar2',
      },
    });
    const user = await oothPrisma.getUserById(id);
    expect(obfuscate(user, '_id')).toMatchSnapshot();
  });

  test('can get user by value', async () => {
    await oothPrisma.insertUser({
      foo: {
        bar: 'baz',
      },
      foo2: {
        bar2: 'baz2',
      },
    });
    const user = await oothPrisma.getUserByValue(['foo.bar', 'foo2.bar2'], 'baz2');
    expect(obfuscate(user, '_id')).toMatchSnapshot();
  });

});
