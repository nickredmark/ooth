const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const session = require('express-session')
const passport = require('passport')
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const {MongoClient, ObjectId} = require('mongodb')
const {sign} = require('jsonwebtoken')
const nodeify = require('nodeify')
const {randomBytes} = require('crypto')

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

class Ooth {
    constructor({
        mongoUrl,
        sharedSecret,
    }) {
        this.mongoUrl = mongoUrl
        this.sharedSecret = sharedSecret

        this.uniqueFields = {}
        this.strategies = {}

    }
    start(app) {
        return (async () => {
            this.app = app
            this.db = await MongoClient.connect(this.mongoUrl)
            this.Users = this.db.collection('users')

            app.use(cookieParser())
            app.use(bodyParser.json())
            app.use(bodyParser.urlencoded({
                extended: true
            }))
            app.use(session({
                secret: 'some secret',
                resave: false,
                saveUninitialized: true,
            }))
            app.use(passport.initialize())
            app.use(passport.session())
            passport.serializeUser((user, done) => {
                done(null, user._id)
            })
            passport.deserializeUser((id, done) => {
                if (typeof id === 'string') {
                    this.Users.findOne(ObjectId(id), done)
                } else {
                    done(null, false)
                }
            })
            
            app.all('/', (req, res) => {
                const response = {}
                if (req.user) {
                    response.token = this.getToken(req.user)
                } else {
                    response.message = "You aren't logged in."
                    const methods = {}
                    Object.keys(this.strategies).forEach(name => {
                        methods[name] = this.strategies[name].methods
                    })
                    
                    response.methods = methods 
                }


                res.send(response)
            })
            this.strategies.root = {
                methods: ['logout']
            }
            app.post('/logout', requireLogged, (req, res) => {
                req.logout()
                res.send({
                    message: 'Logged out'
                })
            })
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


        })()
    }
    getToken(user) {
        return sign({ user }, this.sharedSecret)
    }
    use(name, strategy) {
        this.strategies[name] = {
            methods: []
        }
        strategy({
            name,
            registerPassportMethod: (...args) => {
                this.registerPassportMethod(name, ...args)
            },
            registerMethod: (method, ...handlers) => {
                this.strategies[name].methods.push(method)
                this.app.post(`/${name}/${method}`, ...handlers)
            },
            registerUniqueField: (id, fieldName) => {
                if (!this.uniqueFields[id]) {
                    this.uniqueFields[id] = []
                }
                this.uniqueFields[id].push(`${name}.${fieldName}`)
            },
            getUserById: async (id) => {
                return await this.Users.findOne(ObjectId(id))
            },
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
            updateUser: async (_id, fields) => {
                const actualFields = {}
                Object.keys(fields).forEach(field => {
                    actualFields[`${name}.${field}`] = fields[field]
                })
                return await this.Users.update({
                    _id
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
                this.Users.findOne({
                    _id: req.user._id
                }, (err, user) => {
                    if (err) {
                        return res.status(500).send({
                            status: 'error',
                            message: err
                        })
                    }
                    if (!user) {
                        return res.status(500).send({
                            status: 'error',
                            message: 'Couldn\'t find user.'
                        })
                    }
                    if (!user[strategy]) {
                        return res.status(400).send({
                            status: 'error',
                            message: `This user didn\'t register with strategy ${strategy}.`
                        })
                    }
                    req.user[strategy] = user[strategy]
                    next()
                })
            })
        }
    }
    registerPassportMethod(strategy, method, ...handlers) {
        this.strategies[strategy].methods.push(method)
        const middleware = handlers.slice(0, -1)
        const handler = handlers[handlers.length-1]
        const methodName = strategy !== 'root' ? `${strategy}-${method}` : method
        const routeName = strategy !== 'root' ? `/${strategy}/${method}` : `/${method}`
        passport.use(methodName, handler)
        this.app.post(routeName, ...middleware, (req, res, next) => {
            passport.authenticate(methodName, (err, user, info) => {
                if (err) {
                    return next(err)
                }
                if (!user) {
                    return res.send(info)
                }
                req.login(user, loginErr => {
                    if (loginErr) {
                        return next(loginErr)
                    }

                    const user = req.user
                    res.send({
                        token: this.getToken(user)
                    })
                })
            })(req, res, next)
        })
    }
}

module.exports = Ooth