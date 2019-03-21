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
    var date = new Date(2018, 11, 24, 10, 33, 30, 0);
    // var timestamp = date.getTime();
    const id = await oothPrisma.insertUser({
      foo: {
        baz: 'bar',
      },
      'foo2.baz2': 'bar2',
      'foo2.baz3': 'bar3',
      'foo3.baz': date,
      foo4: {
        baz: date,
      },
      foo5: 'bar',
      foo6: date,
      foo7: {},
    });
    expect(typeof id).toBe('string');
    const user = await oothPrisma.getUserById(id);
    expect(obfuscate(obfuscate(user, 'id'), '_id')).toMatchSnapshot();
  });

  test('can update user', async () => { 
    var date = new Date(2018, 11, 24, 10, 33, 30, 0);    
    const id = await oothPrisma.insertUser({
      foo: {
        baz: 'bar',
      },
      foo2: {
        baz: 'bar2',
        baz2: 'bar2',
      },
      'foo3.baz': date,
      foo4: 'string',
      foo10: {
        baz10: 'unchanged'
      },
      'foo11.baz11': 'bar3',
    });
    await oothPrisma.updateUser(id, {
      foo: {
        baz: 'bar2',
      },
      'foo2.baz': 'bar3',
      'foo2.baz3': 'bar3',
      'foo3.baz': date,
      foo4: {
        baz: date,
      },
      foo5: 'bar',
      foo6: date,
      foo7: {},
    });
    const user = await oothPrisma.getUserById(id);
    expect(obfuscate(obfuscate(user, 'id'), '_id')).toMatchSnapshot();
  }); 

  test.skip('can get user by value', async () => {
    await oothPrisma.insertUser({
      foo: {
        bar: 'baz',
      },
      foo2: {
        bar2: 'baz2',
      },
    });
    const user = await oothPrisma.getUserByValue(['foo.bar', 'foo2.bar2'], 'baz2');
    expect(obfuscate(obfuscate(user, 'id'), '_id')).toMatchSnapshot();
  });

  test.skip('can get user by fields', async () => {
    await oothPrisma.insertUser({
      foo: {
        bar: 'baz',
      },
      foo2: {
        bar2: 'baz2',
      },
      foo3: {
        bar3: 'baz3',
      },
    });
    const user = await oothPrisma.getUser({
      'foo.bar': 'baz',
      'foo2.bar2': 'baz2',
      'foo3.bar3': 'baz3',
    });
    expect(obfuscate(obfuscate(user, 'id'), '_id')).toMatchSnapshot();
  });

});
 