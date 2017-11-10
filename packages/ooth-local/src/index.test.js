import Ooth from 'ooth'
import express from 'express'
import session from 'express-session'
import request from 'request-promise'
import oothLocal from '.'
import {MongoClient} from 'mongodb'

let mongoUrl = 'mongodb://localhost:27017/oothtest'
let config
let app
let server
let ooth
let oothLocalConfig
let db
let cookies = ''

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

describe('ooth-local', () => {

    let onForgotPasswordListener;
    let onRequestVerifyListener;
    let resetToken;
    let verificationToken;

    beforeAll(async () => {
        db = await MongoClient.connect(mongoUrl)
        await db.dropDatabase()
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
        oothLocalConfig = {
            onForgotPassword(data) {
                if (onForgotPasswordListener) {
                    //Store reset token for follow on test
                    resetToken = data.passwordResetToken
                    onForgotPasswordListener(data)
                }
            },

            onGenerateVerificationToken(data) {
                if (onRequestVerifyListener) {
                    //Store verification token for follow on test
                    verificationToken = data.verificationToken
                    onRequestVerifyListener(data)
                }
            }
        }
        app = express()
        app.use(session({
            name: 'api-session-id',
            secret: 'x',
            resave: false,
            saveUninitialized: true,
        }))
        ooth = new Ooth(config)
        await ooth.start(app)
        ooth.use('local', oothLocal(oothLocalConfig))
        await startServer(app)
    })

    afterEach(async () => {
        await server.close()
        await db.dropDatabase()
        cookies = ''
    })

    test('can check status', async () => {
        const res = await request({
            uri: 'http://localhost:8080/status',
            json: true,
        })
        expect(res).toMatchSnapshot()
    })

    test('fails without email', async () => {
        try {
            const res = await request({
                method: 'POST',
                uri: 'http://localhost:8080/local/register',
                json: true,
            })
            expect(false)
        } catch (e) {
            expect(e.response.body).toMatchSnapshot()
        }
    })

    test('fails without password', async () => {
        try {
            const res = await request({
                method: 'POST',
                uri: 'http://localhost:8080/local/register',
                body: {
                    email: 'test@example.com',
                },
                json: true,
            })
            expect(false)
        } catch (e) {
            expect(e.response.body).toMatchSnapshot()
        }
    })

    test('fails without valid password', async () => {
        try {
            const res = await request({
                method: 'POST',
                uri: 'http://localhost:8080/local/register',
                body: {
                    email: 'test@example.com',
                    password: 'xxxxxx',
                },
                json: true,
            })
            expect(false)
        } catch (e) {
            expect(e.response.body).toMatchSnapshot()
        }
    })

    test('can register', async () => {
        const res = await request({
            method: 'POST',
            uri: 'http://localhost:8080/local/register',
            body: {
                email: 'test@example.com',
                password: 'Asdflba09',
            },
            json: true,
        })
        expect(res).toMatchSnapshot()        
    })

    describe('after registration', () => {
        beforeEach(async () => {
            await request({
                method: 'POST',
                uri: 'http://localhost:8080/local/register',
                body: {
                    email: 'test@example.com',
                    password: 'Asdflba09',
                },
                json: true,
            })
        })

        test('login fails with wrong password', async () => {
            try {
                const res = await request({
                    method: 'POST',
                    uri: 'http://localhost:8080/local/login',
                    body: {
                        username: 'test@example.com',
                        password: 'Asdflba099',
                    },
                    json: true,
                })
                expect(false)
            } catch (e) {
                expect(e.response.body).toMatchSnapshot()
            }
        })

        test('can login', async () => {
            const res = await request({
                method: 'POST',
                uri: 'http://localhost:8080/local/login',
                body: {
                    username: 'test@example.com',
                    password: 'Asdflba09',
                },
                json: true,
            })
            delete(res.user._id)
            expect(res).toMatchSnapshot()
        })

        test('can login', async () => {
            const res = await request({
                method: 'POST',
                uri: 'http://localhost:8080/local/login',
                body: {
                    username: 'test@example.com',
                    password: 'Asdflba09',
                },
                json: true,
            })
            delete(res.user._id)
            expect(res).toMatchSnapshot()
        })

        test('can forget password', async () => {
            onForgotPasswordListener = jest.fn()
            const res = await request({
                method: 'POST',
                uri: 'http://localhost:8080/local/forgot-password',
                body: {
                    username: 'test@example.com',
                },
                json: true,
            })
            expect(obfuscate(onForgotPasswordListener.mock.calls[0][0], '_id', 'passwordResetToken')).toMatchSnapshot()
        })

        test('can reset password', async () =>{
            onForgotPasswordListener = jest.fn()

            //Store the password reset token so we can use it later
            await request({
                method: 'POST',
                uri: 'http://localhost:8080/local/forgot-password',
                body: {
                    username: 'test@example.com',
                },
                json: true,
            })
            const res = await request({
                method: 'POST',
                uri: 'http://localhost:8080/local/reset-password',
                body: {
                    token: resetToken,
                    newPassword: 'Asdflba10',
                },
                json: true,
            })
            expect(res).toMatchSnapshot()
        })

        describe('after login', () => {
            beforeEach(async () => {
                const res = await request({
                    method: 'POST',
                    uri: 'http://localhost:8080/local/login',
                    body: {
                        username: 'test@example.com',
                        password: 'Asdflba09',
                    },
                    json: true,
                    resolveWithFullResponse: true
                })
                cookies = res.headers['set-cookie']
            })

            test('can generate verification token', async () => {
                onRequestVerifyListener = jest.fn()
                const res = await request({
                    method: 'POST',
                    uri: 'http://localhost:8080/local/generate-verification-token',
                    json: true,
                    headers: {
                        Cookie: cookies
                    }
                })
                expect(obfuscate(onRequestVerifyListener.mock.calls[0][0], '_id', 'verificationToken')).toMatchSnapshot()
            })

            test('can verify user with token', async () => {
                onRequestVerifyListener = jest.fn()
                //Store verification token for later use
                await request({
                    method: 'POST',
                    uri: 'http://localhost:8080/local/generate-verification-token',
                    json: true,
                    headers: {
                        Cookie: cookies
                    }
                })
                const res = await request({
                    method: 'POST',
                    uri: 'http://localhost:8080/local/verify',
                    json: true,
                    body: {
                        token: verificationToken
                    },
                    headers: {
                        Cookie: cookies
                    }
                })
                //This is a bit messy, probably need a nestedObfuscate
                const obfuscatedRes = {
                    message: (res.message ? res.message : null),
                    user: obfuscate(res.user, '_id')
                }
                expect(obfuscatedRes).toMatchSnapshot()
            })

            test('can check status', async () => {
                const res = await request({
                    uri: 'http://localhost:8080/status',
                    json: true,
                    headers: {
                        Cookie: cookies
                    }
                })
                delete(res.user._id)
                expect(res).toMatchSnapshot()
            })

            test('can set username', async () => {
                const res = await request({
                    method: 'POST',
                    uri: 'http://localhost:8080/local/set-username',
                    body: {
                        username: 'heythere12_'
                    },
                    json: true,
                    headers: {
                        Cookie: cookies
                    }
                })
                delete(res.user._id)
                expect(res).toMatchSnapshot()
            })

            test('can set email', async () => {
                const res = await request({
                    method: 'POST',
                    uri: 'http://localhost:8080/local/set-email',
                    body: {
                        email: 'test@example.com'
                    },
                    json: true,
                    headers: {
                        Cookie: cookies
                    }
                })
                delete(res.user._id)
                expect(res).toMatchSnapshot()
            })

            test('can\'t set invalid username', async () => {
                try {
                    await request({
                        method: 'POST',
                        uri: 'http://localhost:8080/local/set-username',
                        body: {
                            username: 'bl'
                        },
                        json: true,
                        headers: {
                            Cookie: cookies
                        }
                    })
                    expect(false)
                } catch (e) {
                    expect(e.response.body).toMatchSnapshot()
                }
            })
        })
    })


})