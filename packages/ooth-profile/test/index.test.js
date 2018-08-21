import Ooth from 'ooth'
import express from 'express'
import session from 'express-session'
import request from 'request-promise'
import oothProfile from '../src'
import {MongoClient, ObjectId} from 'mongodb'
import OothMongo from 'ooth-mongo'
import oothGuest from 'ooth-guest'

const dbName = 'oothtest'
let client
let mongoUrl = `mongodb://localhost:27017/${dbName}`
let config
let app
let server
let ooth
let oothMongo
let oothProfileConfig
let db
let cookies = ''

const startServer = () => new Promise((resolve) => {
  server = app.listen(8080, resolve)
})

const obfuscate = (obj, ...keys) => {
    const res = {}
    for (const key of Object.keys(obj)) {
        if (keys.indexOf(key) > -1) {
            res[key] = '<obfuscated>'
        } else {
            res[key] = obj[key]            
        }
    }

    return res
}

describe('ooth-profile', () => {
  beforeAll(async () => {
    client = await MongoClient.connect(mongoUrl)
    db = await client.db(dbName)
    await db.dropDatabase()
  })
  
  afterAll(async () => {
    await client.close()
  })

  beforeEach(async () => {
    config = {
        mongoUrl,
        sharedSecret: '',
        standalone: false,
        path: '',
        onLogin: () => null,
        onLogout: () => null,
    }
    oothProfileConfig = {
      fields: {
        firstName: {
        },
        lastName: {
        },
        age: {
          validate(value, user) {
            if (Number.isNaN(value)) {
              throw new Error(`Age is not a number: ${value}.`)
            }
            if (value < 0 || value > 150) {
              throw new Error(`Age out of bounds ${value}.`)
            }
          },
        },
      },
    }
    app = express()
    app.use(session({
        name: 'api-session-id',
        secret: 'x',
        resave: false,
        saveUninitialized: true,
    }))
    oothMongo = new OothMongo(db, ObjectId)
    ooth = new Ooth(config)
    ooth.use('guest', oothGuest())
    ooth.use('profile', oothProfile(oothProfileConfig))
    await ooth.start(app, oothMongo)
    await startServer(app)
    const res = await request({
      method: 'POST',
      uri: 'http://localhost:8080/guest/register',
      resolveWithFullResponse: true,
    })
    cookies = res.headers['set-cookie']
  })

  afterEach(async () => {
      await server.close()
      await db.dropDatabase()
      cookies = ''
  })

  test('registers routes', async () => {
      const res = await request({
          uri: 'http://localhost:8080/',
          json: true,
      })
      expect(res.methods.profile).toMatchSnapshot()
  })
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
    })
    expect(obfuscate(res.user, '_id')).toMatchSnapshot()
  })

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
      })
    } catch (e) {
      expect(e.response.body).toMatchSnapshot()
      return
    }
    throw new Error('Didn\'t fail')
  })

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
      })
    } catch (e) {
      expect(e.response.body).toMatchSnapshot()
      return
    }
    throw new Error('Didn\'t fail')
  })
});
