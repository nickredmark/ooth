import Ooth from 'ooth'
import express from 'express'
import session from 'express-session'
import request from 'request-promise'
import oothRoles from '../src'
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
let db
let admin
let adminCookies = ''
let user
let userCookies = ''

const startServer = () => {
    return new Promise((resolve) => {
        server = app.listen(8080, resolve())
    })
}

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

describe('ooth-roles', () => {
  beforeAll(async () => {
    client = await MongoClient.connect(mongoUrl)
    db = client.db(dbName)
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
    ooth.use('roles', oothRoles())
    await ooth.start(app, oothMongo)
    await startServer(app)
    let res = await request({
      method: 'POST',
      uri: 'http://localhost:8080/guest/register',
      resolveWithFullResponse: true,
      json: true,
    })
    adminCookies = res.headers['set-cookie']
    admin = res.body.user

    db.collection('users').update({
      _id: ObjectId(admin._id)
    }, {
      $set: {
        roles: {
          roles: ['admin'],
        },
      }
    })

    res = await request({
      method: 'POST',
      uri: 'http://localhost:8080/guest/register',
      resolveWithFullResponse: true,
      json: true,
    })
    userCookies = res.headers['set-cookie']
    user = res.body.user
  })

  afterEach(async () => {
    await server.close()
    await db.dropDatabase()
    adminCookies = ''
  })

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
    })

    expect(obfuscate(res.user, '_id')).toMatchSnapshot()
  })

  test('nonadmin can\'t set roles', async () => {
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
      })
    } catch (e) {
      expect(e.response.body).toMatchSnapshot()
      return
    }
    throw new Error('Didn\'t fail')
  })
})
