import Ooth from '.'
import express from 'express'
import session from 'express-session'
import request from 'request-promise'

let config
let app 
let server
let ooth

const startServer = () => {
    return new Promise((resolve) => {
        server = app.listen(8080, resolve())
    })
}

describe('ooth', () => {

    beforeEach(async () => {
        config = {
            mongoUrl: 'mongodb://localhost:27017/oothtest',
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
        ooth = new Ooth(config)
        await ooth.start(app)
    })

    afterEach(async () => {
        await server.close()
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

})

