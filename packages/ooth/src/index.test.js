import Ooth from '.'
import express from 'express'
import session from 'express-session'
import request from 'request-promise'
import Strategy from 'passport-strategy'
import {MongoClient, ObjectId} from 'mongodb'
import OothMongo from 'ooth-mongo'
const CustomStrategy = require('passport-custom').Strategy
import _ from 'lodash'

let mongoUrl = 'mongodb://localhost:27017/oothtest'
let db
let config
let app
let server
let ooth
let oothMongo

const startServer = () => {
    return new Promise((resolve) => {
        server = app.listen(8080, resolve())
    })
}

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

describe('ooth', () => {

    let onRegister = () => null
    let onLogin = () => null
    let onLogout = () => null

    beforeAll(async () => {
        db = await MongoClient.connect(mongoUrl)
        await db.dropDatabase()
    })

    afterAll(async () => {
        await db.close()
    })

    beforeEach(async () => {
        config = {
            sharedSecret: '',
            standalone: false,
            path: '',
            onLogin: () => onLogin(),
            onLogout: () => onLogout(),
            onRegister: () => onRegister(),
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
        await ooth.start(app, oothMongo)
    })

    afterEach(async () => {
        await server.close()
        await db.dropDatabase()
    })

    test('main route has status', async () => {
        await startServer(app)
        const res = await request({
            uri: 'http://localhost:8080',
            json: true,
        })
        expect(res).toMatchSnapshot()
    })

    test('can register plugin', async () => {
        ooth.use('test', (...args) => {
            expect(args).toMatchSnapshot()
        })
    })

    test('main route has additional passport route for passport method', async () => {
        ooth.use('test', ({registerPassportMethod}) => {
            registerPassportMethod('login', () => null)
        })
        await startServer(app)
        const res = await request({
            uri: 'http://localhost:8080',
            json: true,
        })
        expect(res).toMatchSnapshot()
    })

    test('main route has additional route for method', async () => {
        ooth.use('test', ({registerMethod}) => {
            registerMethod('login', () => null)
        })
        await startServer(app)
        const res = await request({
            uri: 'http://localhost:8080',
            json: true,
        })
        expect(res).toMatchSnapshot()
    })

    describe('methods', () => {
        test('handle method', async () => {
            ooth.use('test', ({registerMethod}) => {
                registerMethod('login', (req, res) => {
                    res.send({
                        message: 'hi'
                    })
                })
            })

            await startServer(app)
            const res = await request({
                method: 'POST',
                uri: 'http://localhost:8080/test/login',
                json: true,
            })
            expect(res).toMatchSnapshot()
        })

        test('handle errors', async () => {
            ooth.use('test', ({registerMethod}) => {
                registerMethod('login', () => {
                    throw new Error('Error message.')
                })
            })

            await startServer(app)
            try {
                const res = await request({
                    method: 'POST',
                    uri: 'http://localhost:8080/test/login',
                    json: true,
                })
                expect(false)
            } catch (e) {
                expect(e.response.body).toMatchSnapshot()
            }
        })

        test('handle async errors', async () => {
            ooth.use('test', ({registerMethod}) => {
                registerMethod('login', () => {
                    return Promise.resolve().then(() => {
                        throw new Error('Error message.')
                    })
                })
            })

            await startServer(app)
            try {
                const res = await request({
                    method: 'POST',
                    uri: 'http://localhost:8080/test/login',
                    json: true,
                })
                expect(false)
            } catch (e) {
                expect(e.response.body).toMatchSnapshot()
            }
        })
    })

    describe('connect method', () => {

        beforeEach(async () => {
            ooth.use('test', ({
                registerProfileField,
                registerUniqueField,
                registerPassportConnectMethod,
            }) => {
                registerProfileField('foo')
                registerUniqueField('bar', 'bar')
                registerPassportConnectMethod('login', new CustomStrategy((req, done) => done(null, req.body)))
            })
            ooth.use('test2', ({
                registerProfileField,
                registerUniqueField,
                registerPassportConnectMethod,
            }) => {
                registerProfileField('baz')
                registerUniqueField('bar', 'bar')
                registerPassportConnectMethod('login', new CustomStrategy((req, done) => done(null, req.body)))
            })
            await startServer(app)
        })

        test('can register', async () => {
            const res = await request({
                method: 'POST',
                uri: 'http://localhost:8080/test/login',
                body: {
                    foo: 1,
                    bar: 2,
                },
                json: true,
            })
            expect(obfuscate(res.user, '_id')).toMatchSnapshot()
        })

        test('can log in', async () => {
            const res = await request({
                method: 'POST',
                uri: 'http://localhost:8080/test/login',
                body: {
                    foo: 1,
                    bar: 2,
                },
                json: true,
            })
            expect(obfuscate(res, 'user._id')).toMatchSnapshot()
        })

        test('plugin can add properties to user', async () => {
            ooth.use('test', ({registerUserTransformer, registerProfileField}) => {
                registerProfileField('testProp', 'testProp')
                registerUserTransformer(user => {
                    if (user) {
                        user.test.testProp = 'foo'
                    }
                    return user
                })
            })
            const res = await request({
                method: 'POST',
                uri: 'http://localhost:8080/test/login',
                body: {
                    foo: 1,
                    bar: 2,
                },
                json: true,
            })
            expect(obfuscate(res, 'user._id')).toMatchSnapshot()
        })

        describe('after login', () => {
            let cookies
            let user

            beforeEach(async () => {
                const res = await request({
                    method: 'POST',
                    uri: 'http://localhost:8080/test/login',
                    body: {
                        foo: 1,
                        bar: 2,
                    },
                    json: true,
                    resolveWithFullResponse: true
                })
                cookies = res.headers['set-cookie']
                user = res.body.user
            })

            test('can log out', async () => {
                const res = await request({
                    method: 'POST',
                    uri: 'http://localhost:8080/logout',
                    json: true,
                    headers: {
                        Cookie: cookies
                    }
                })
                expect(res).toMatchSnapshot()
            })

            test('can log in again', async () => {
                const res = await request({
                    method: 'POST',
                    uri: 'http://localhost:8080/test/login',
                    body: {
                        foo: 2,
                        bar: 2,
                    },
                    json: true
                })
                expect(res.user._id).toBe(user._id)
                expect(obfuscate(res.user, '_id')).toMatchSnapshot()
            })

            test('can log in with other strategy', async () => {
                const res = await request({
                    method: 'POST',
                    uri: 'http://localhost:8080/test2/login',
                    body: {
                        foo: 2,
                        bar: 2,
                    },
                    json: true
                })
                expect(res.user._id).toBe(user._id)
                expect(obfuscate(res.user, '_id')).toMatchSnapshot()
            })

            test('can log in with other strategy', async () => {
                const res = await request({
                    method: 'POST',
                    uri: 'http://localhost:8080/test2/login',
                    body: {
                        foo: 2,
                        bar: 2,
                    },
                    json: true
                })
                expect(res.user._id).toBe(user._id)
                expect(obfuscate(res.user, '_id')).toMatchSnapshot()
            })

            test('can connect another strategy', async () => {
                const res = await request({
                    method: 'POST',
                    uri: 'http://localhost:8080/test2/login',
                    body: {
                        bar: 3,
                    },
                    json: true,
                    headers: {
                        Cookie: cookies
                    }
                })
                expect(res.user._id).toBe(user._id)
                expect(obfuscate(res.user, '_id')).toMatchSnapshot()
            })
        })
    })
})
