const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const express = require('express')
const session = require('express-session')
const passport = require('passport')
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const {MongoClient, ObjectId} = require('mongodb')
const {sign} = require('jsonwebtoken')
const nodeify = require('nodeify')
const {randomBytes} = require('crypto')
const expressWs = require('express-ws')

function randomToken() {
    return randomBytes(43).toString('hex')
}

function requireLogged(req, res, next) {
    if (!req.user) {
        return res.status(400).send({
            status: 'error',
            message: 'Not logged in'
        })        
    }
    next()
}

function requireNotLogged(req, res, next) {
    if (req.user) {
        return res.status(400).send({
            status: 'error',
            message: 'User is already logged in'
        })
    }
    next()
}

function requireNotRegistered(req, res, next) {
    if (req.user) {
        return res.status(400).send({
            status: 'error',
            message: 'Current user is already registered'
        })
    }
    next()
}

function nodeifyAsync(asyncFunction) {
    return function(...args) {
        return nodeify(asyncFunction(...args.slice(0, -1)), args[args.length-1])
    }
}

const prepare = (o) => {
    if (o && o._id) {
        o._id = o._id.toString()
    }
    return o
}

class Ooth {
    constructor({
        mongoUrl,
        sharedSecret,
        standalone,
        path,
        onLogin,
        onLogout
    }) {
        this.mongoUrl = mongoUrl
        this.sharedSecret = sharedSecret
        this.standalone = standalone
        this.path = path || '/'
        this.onLogin = onLogin
        this.onLogout = onLogout
        this.uniqueFields = {}
        this.strategies = {}
        this.connections = {}
    }

    start(app) {
        return (async () => {
            this.app = app
            this.db = await MongoClient.connect(this.mongoUrl)
            this.Users = this.db.collection('users')

            // App-wide configuration
            app.use(cookieParser())
            app.use(bodyParser.json())
            app.use(passport.initialize())
            app.use(passport.session())
            expressWs(app)

            this.route = express.Router()
            app.use(this.path, this.route)

            passport.serializeUser((user, done) => {
                done(null, user._id)
            })
            passport.deserializeUser((id, done) => {
                if (typeof id === 'string') {
                    this.Users.findOne(ObjectId(id), (e, user) => {
                        if (e) {
                            done(e, user)
                        }                        
                        done(e, prepare(user))
                    })
                } else {
                    done(null, false)
                }
            })
            
            this.route.all('/', (req, res) => {
                const methods = {}
                Object.keys(this.strategies).forEach(name => {
                    methods[name] = this.strategies[name].methods
                })
                res.send({
                    methods
                })
            })
            this.strategies.root = {
                methods: ['status', 'logout'],
                profileFields: {
                    _id: true
                }
            }      
            this.route.get('/status', (req, res) => {
                if (req.user) {
                    const user = this.getProfile(req.user)
                    if (this.standalone) {
                        res.send({
                            user,
                            token: this.getToken(user)
                        })
                    } else {
                        res.send({
                            user: this.getProfile(user)
                        })
                    }
                } else {
                    res.send({
                        user: null
                    })
                }
            })
            this.route.post('/logout', requireLogged, (req, res) => {
                const user = req.user
                this.sendStatus(req, {})
                req.logout()
                if (this.onLogout) {
                    this.onLogout(user)
                }
                res.send({
                    message: 'Logged out'
                })
            })

            if (this.standalone) {
                this.registerPassportMethod('root', 'login', requireNotLogged, new JwtStrategy({
                    secretOrKey: this.sharedSecret,
                    jwtFromRequest: (req) => {
                        if (!req.body || !req.body.token) {
                            throw new Error('Malformed body')
                        }
                        return req.body.token
                    }
                }, nodeifyAsync(async (payload) => {
                    if (!payload.user || !payload.user._id || typeof payload.user._id !== 'string') {
                        console.error(payload)
                        throw new Error('Malformed token payload.')
                    }
                    return payload.user
                })))
            }

            this.route.ws('/status', (ws, req) => {
                if (!this.connections[req.session.id]) {
                    this.connections[req.session.id] = []
                }
                this.connections[req.session.id].push(ws)

                if (req.user) {
                    ws.send(JSON.stringify({
                        user: this.getProfile(req.user)
                    }))
                } else {
                    ws.send(JSON.stringify({
                        user: null
                    }))
                }

                ws.on('close', () => {
                    this.connections[req.session.id] = this.connections[req.session.id].filter(wss => ws !== wss)
                })
            })
        })()
    }

    getUserById(id) {
        return this.Users.findOne(ObjectId(id))
    }

    getProfile(user) {
        if (!user) {
            return null
        }
        const profile = {}
        for (let strategyName of Object.keys(this.strategies)) {
            if (!user[strategyName]) {
                continue
            }

            for (let fieldName of Object.keys(this.strategies[strategyName].profileFields)) {
                if (strategyName === 'root') {
                    profile[fieldName] = user[fieldName]
                } else {
                    if (!profile[strategyName]) {
                        profile[strategyName] = {}
                    }
                    profile[strategyName][fieldName] = user[strategyName][fieldName]
                }
            }
        }
        return profile
    }

    getToken(user) {
        return sign({ user }, this.sharedSecret)
    }

    use(name, strategy) {
        this.strategies[name] = {
            methods: [],
            profileFields: {}
        }
        strategy({
            name,
            registerPassportMethod: (...args) => {
                this.registerPassportMethod(name, ...args)
            },
            registerMethod: (method, ...handlers) => {
                this.strategies[name].methods.push(method)
                
                // Split handlers into [...middleware, handler]
                const middleware = handlers.slice(0, -1)
                const handler = handlers[handlers.length-1]

                const finalHandler = (req, res) => {
                    try {
                        const result = handler(req, res)
                        if (result.catch) {
                            result.catch((e) => {
                                return res.status(400).send({
                                    status: 'error',
                                    message: e.message,
                                })
                            })
                        }
                    } catch (e) {
                        return res.status(400).send({
                            status: 'error',
                            message: e.message,
                        })
                    }
                }

                this.route.post(`/${name}/${method}`, ...middleware, finalHandler)
            },
            registerGetMethod: (method, ...handlers) => {
                this.strategies[name].methods.push(method)
                this.route.get(`/${name}/${method}`, ...handlers)
            },
            registerUniqueField: (id, fieldName) => {
                if (!this.uniqueFields[id]) {
                    this.uniqueFields[id] = []
                }
                this.uniqueFields[id].push(`${name}.${fieldName}`)
            },
            registerProfileField: (fieldName) => {
                this.strategies[name].profileFields[fieldName] = true;
            },
            getProfile: user => this.getProfile(user),
            getUserById: (id) => this.getUserById(id),
            getUserByUniqueField: async (fieldName, value) => {
                return await this.Users.findOne({
                    $or: this.uniqueFields[fieldName].map(field => ({
                        [field]: value
                    }))
                })
            },
            getUserByFields: async (fields) => {
                const actualFields = {}
                Object.keys(fields).forEach(field => {
                    actualFields[`${name}.${field}`] = fields[field]
                })
                return await this.Users.findOne(actualFields)
            },
            updateUser: async (id, fields) => {
                const actualFields = {}
                Object.keys(fields).forEach(field => {
                    actualFields[`${name}.${field}`] = fields[field]
                })
                return await this.Users.update({
                    _id: ObjectId(id)
                }, {
                    $set: actualFields
                })
            },
            insertUser: async (fields) => {
                const query = {}
                if (fields) {
                    query[name] = fields
                }
                const {insertedId} = await this.Users.insertOne(query)
                return insertedId
            },
            requireLogged,
            requireNotLogged,
            requireNotRegistered,
            requireRegisteredWithThis: this.requireRegisteredWith(name)
        })
    }

    requireRegisteredWith(strategy) {
        return (req, res, next) => {
            return requireLogged(req, res, () => {
                const user = req.user
                if (!user[strategy]) {
                    return res.status(400).send({
                        status: 'error',
                        message: `This user didn\'t register with strategy ${strategy}.`
                    })
                }
                req.user[strategy] = user[strategy]
                next()
            })
        }
    }

    sendStatus(req, status) {
        if (req.session && this.connections[req.session.id]) {
            this.connections[req.session.id].forEach(ws => {
                ws.send(JSON.stringify(status))
            })
        }
    }

    registerPassportMethod(strategy, method, ...handlers) {
        this.strategies[strategy].methods.push(method)

        // Split handlers into [...middleware, handler]
        const middleware = handlers.slice(0, -1),
            handler = handlers[handlers.length-1],
            methodName = strategy !== 'root' ? `${strategy}-${method}` : method,
            routeName = strategy !== 'root' ? `/${strategy}/${method}` : `/${method}`

        passport.use(methodName, handler)
        this.route.post(routeName, ...middleware, (req, res, next) => {
            passport.authenticate(methodName, (err, u, info) => {
                if (err) {
                    return res.status(400).send({
                        status: 'error',
                        message: err.message
                    })
                }
                if (!u) {
                    return res.status(400).send({
                        status: 'error',
                        message: info && info.message || 'Unknown error.'
                    })
                }
                req.login(u, loginErr => {
                    if (loginErr) {
                        return res.status(400).send({
                            status: 'error',
                            message: loginErr.message || loginErr
                        })
                    }

                    const user = this.getProfile(u)

                    this.sendStatus(req, {
                        user
                    })

                    if (this.onLogin) {
                        this.onLogin(user)
                    }

                    if (this.standalone) {
                        res.send({
                            user,
                            token: this.getToken(user)
                        })
                    } else {
                        res.send({
                            user
                        })
                    }
                })
            })(req, res, next)
        })
    }
}

module.exports = Ooth