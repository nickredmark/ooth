import OothMongo from '../src'
import {MongoClient, ObjectId} from 'mongodb'
import _ from 'lodash'

const mongoUrl = 'mongodb://localhost:27017/oothtest'
let oothMongo
let db

const obfuscate = (obj, ...paths) => {
    const res = _.cloneDeep(obj);
    for (const path of paths) {
        const keys = path.split('.')
        let current = res
        for (const key of keys.slice(0, -1)) {
            current = current[key]
        }
        current[keys[keys.length - 1]] = '<obfuscated>';
    }

    return res
}

describe('ooth-mongo', () => {
    beforeAll(async () => {
        db = await MongoClient.connect(mongoUrl)
        await db.dropDatabase()
        oothMongo = new OothMongo(db, ObjectId)
    })

    afterAll(async () => {
        await db.close()
    })

    afterEach(async () => {
        await db.dropDatabase()
    })

    test('can insert user and get it', async () => {
        const id = await oothMongo.insertUser({
            foo: 'bar'
        })
        const user = await oothMongo.getUserById(id)
        expect(obfuscate(user, '_id')).toMatchSnapshot()
    })

    test('can update user', async () => {
        const id = await oothMongo.insertUser({})
        await oothMongo.updateUser(id, {
            foo: 'bar'
        })
        const user = await oothMongo.getUserById(id)
        expect(obfuscate(user, '_id')).toMatchSnapshot()        
    })

    test('can get user by value', async () => {
        const id = await oothMongo.insertUser({
            foo: {
                bar: 'baz'
            },
            foo2: {
                bar2: 'baz2'
            }
        })
        const user = await oothMongo.getUserByValue([
            'foo.bar',
            'foo2.bar2'
        ], 'baz2')
        expect(obfuscate(user, '_id')).toMatchSnapshot()
    })

    test('can get user by fields', async () => {
        const id = await oothMongo.insertUser({
            foo: {
                bar: 'baz'
            },
            foo2: {
                bar2: 'baz2'
            }
        })
        const user = await oothMongo.getUser({
            'foo.bar': 'baz',
            'foo2.bar2': 'baz2',
        })
        expect(obfuscate(user, '_id')).toMatchSnapshot()        
    })
})