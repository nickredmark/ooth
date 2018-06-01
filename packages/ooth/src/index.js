const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const express = require('express')
const session = require('express-session')
const passport = require('passport')
const JwtStrategy = require('passport-jwt').Strategy
const { sign } = require('jsonwebtoken')
const nodeify = require('nodeify')
const { randomBytes } = require('crypto')
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
    return function (...args) {
        return nodeify(asyncFunction(...args.slice(0, -1)), args[args.length - 1])
    }
}

function post(route, routeName, ...handlers) {
    const middleware = handlers.slice(0, -1)
    const handler = handlers[handlers.length - 1]
    route.post(routeName, ...middleware, (req, res) => {
        try {
            return handler(req, res)
                .then(data => {
                    return res.send(data)
                })
                .catch(e => {
                    console.error(e)
                    return res.status(400).send({
                        status: 'error',
                        message: e.message || e,
                    })
                })
        } catch (e) {
            return res.status(400).send({
                status: 'error',
                message: e.message || e,
            })
        }
    })
}

function authenticate(passport, methodName, req, res) {
    return new Promise((resolve, reject) => {
        const auth = passport.authenticate(methodName, (err, user, info) => {
            if (err) {
                reject(err)
            }

            if (!user) {
                reject(new Error(info && info.message || 'Unknown error.'))
            }

            resolve(user)
        })
        auth(req, res)
    })
}

function login(req, user) {
    return new Promise((resolve, reject) => {
        return req.login(user, err => {
            if (err) {
                reject(err)
            }

            resolve()
        })
    })
}

class Ooth {
    constructor({
        sharedSecret,
        standalone,
        path,
        tokenExpires, // TODO NEXT MAJOR: true
        onLogin,
        onRegister,
        onLogout,
        specJwt, // TODO NEXT MAJOR: true
        onRefreshRequest,
        onRefreshRequestUser,
        refreshTokenExpiry = 60 * 60 * 24, // seconds, 1 day
    }) {
        this.sharedSecret = sharedSecret
        this.standalone = standalone
        this.path = path || '/'
        this.tokenExpires = tokenExpires
        this.onLogin = onLogin
        this.onRegister = onRegister
        this.onLogout = onLogout
        this.specJwt = specJwt
        this.onRefreshRequest = onRefreshRequest
        this.onRefreshRequestUser = onRefreshRequestUser
        this.refreshTokenExpiry = refreshTokenExpiry
        this.uniqueFields = {}
        this.strategies = {}
        this.connections = {}
        this.route = express.Router()
    }

    start = async (app, backend) => {
        if (!app) {
            throw new Error('App is required.')
        }
        this.app = app

        if (!backend) {
            throw new Error('Backend is required.')
        }
        this.backend = backend

        // App-wide configuration
        app.use(cookieParser())
        app.use(bodyParser.json())
        app.use(passport.initialize())
        app.use(passport.session())
        expressWs(app)

        app.use(this.path, this.route)

        passport.serializeUser((user, done) => {
            done(null, user._id)
        })
        passport.deserializeUser((id, done) => {
            if (typeof id === 'string') {
                this.backend.getUserById(id)
                    .then(user => {
                        done(null, user)
                    })
                    .catch(done)
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
            methods: ['status', 'logout', 'refresh'],
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
        post(this.route, '/logout', requireLogged, async (req, res) => {
            const user = req.user
            this.sendStatus(req, {})
            req.logout()
            if (this.onLogout) {
                this.onLogout(user)
            }
            return {
                message: 'Logged out'
            }
        })

        if (this.standalone) {
            const passportJwtStrategy = new JwtStrategy({
                    secretOrKey: this.sharedSecret,
                    jwtFromRequest: (req) => {
                        let token;
                        if (req.body && req.body.token) {
                            token = req.body.token
                        }
                        const authorization = req.get('authorization');
                        if (authorization) {
                            token = authorization.split(' ').pop();
                        }

                        if (!token) {
                            throw new Error('No token found.')
                        }
                        
                        return token
                    }
                },
                nodeifyAsync(async (payload) => {
                    if (!payload._id && (!payload.user || !payload.user._id || typeof payload.user._id !== 'string')) {

                        throw new Error('Malformed token payload.')
                    }
                    return payload._id ? payload : payload.user;
                }));

            // Login with JWT token
            this.registerPassportMethod('root', 'login', requireNotLogged, passportJwtStrategy);

            // Refresh tokens
            passport.use('refresh', passportJwtStrategy);
            this.route.get('/refresh', async (req, res) => {
                
                const tokenPayload = await authenticate(passport, 'refresh', req, res)
    
                if (!tokenPayload || !tokenPayload._id) {
                    throw new Error('No user for refresh')
                }
    
                return this.backend.getUserById(tokenPayload._id)
                    .then(user => {
    
                        if (!user) {
                            throw new Error('No user for refresh.')
                        }
    
                        const refreshToken = randomToken();
                        const now = new Date();
                        const refreshTokenExpiresAt = new Date(now.valueOf() + (this.refreshTokenExpiry * 1000));
                        return this.backend.updateUser(user._id, {
                            refreshToken,
                            refreshTokenExpiresAt
                        }).then(() => {
                            return this.backend.getUserById(user._id)
                        }).then(user => {
                            return res.send({
                                refreshToken,
                                refreshTokenExpiresAt
                            })
                        })
                  })
            })
            this.route.post('/refresh', async (req, res) => {
                if (!req.body.refreshToken) {
                    throw new Error('Must supply refreshToken.')
                }

                if (this.onRefreshRequest) {
                    this.onRefreshRequest({
                        refreshToken: req.body.refreshToken
                    })
                }
    
                try {
                    const user = await this.backend.getUserByValue(['refreshToken'], req.body.refreshToken)
                        .then(user => {
                            if (!user) {
                                throw new Error('No user found for that refreshToken.')
                            }
        
                            if (!user || !user.refreshTokenExpiresAt) {
                                throw new Error('Bad refreshToken.')
                            }
        
                            const nowDate = new Date();
                            const tokenExpiryDate = new Date(user.refreshTokenExpiresAt);
        
                            if (nowDate.getTime() > tokenExpiryDate.getTime()) {
                                throw new Error('Refresh token expired.')
                            }
                            return user;
                        });
                } catch(e) {
                    return res.status(400).send({
                        status: 'error',
                        message: e.message || e,
                    })
                }

                if (this.onRefreshRequestUser) {
                    this.onRefreshRequestUser({
                        user,
                        refreshToken: req.body.refreshToken
                    })
                }

                return res.send({
                    token: this.getToken(user)
                })
            });
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
    }

    getUserByUniqueField = async (fieldName, value) => {
        return await this.backend.getUserByValue(Object.keys(this.uniqueFields[fieldName]).map(strategyName => `${strategyName}.${this.uniqueFields[fieldName][strategyName]}`), value)
    }

    updateUserStrategy = async (strategyName, id, fields) => {
        const actualFields = {}
        Object.keys(fields).forEach(field => {
            actualFields[`${strategyName}.${field}`] = fields[field]
        })
        return await this.backend.updateUser(id, actualFields)
    }

    insertUser = async (strategyName, fields) => {
        const query = {}
        if (fields) {
            query[strategyName] = fields
        }
        return await this.backend.insertUser(query)
    }

    getProfile(user) {
        if (!user) {
            return null
        }
        const profile = {}
        for (let strategyName of Object.keys(this.strategies)) {
            if (strategyName !== 'root' && !user[strategyName]) {
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
        let token = {
            iat: new Date().getTime() / 1000, // Unix timestamp
        };

        if (this.tokenExpires && this.tokenExpires > 0) {
            token.exp = token.iat + this.tokenExpires;
        }

        if (this.specJwt) {
            token._id = user._id
        } else {
            token = {
                ...token,
                ...user,
            }
        }
        return sign(token, this.sharedSecret)
    }

    use(name, strategy) {
        this.strategies[name] = {
            methods: [],
            profileFields: {},
            uniqueFields: {},
        }
        strategy({
            name,
            registerPassportMethod: (...args) => {
                this.registerPassportMethod(name, ...args)
            },
            registerPassportConnectMethod: (...args) => {
                this.registerPassportConnectMethod(name, ...args)
            },
            registerMethod: (method, ...handlers) => {
                this.strategies[name].methods.push(method)

                // Split handlers into [...middleware, handler]
                const middleware = handlers.slice(0, -1)
                const handler = handlers[handlers.length - 1]

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
                    this.uniqueFields[id] = {}
                }
                this.uniqueFields[id][name] = fieldName
            },
            registerStrategyUniqueField: (fieldName) => {
                this.strategies[name].uniqueFields[fieldName] = true;
            },
            registerProfileField: (fieldName) => {
                this.strategies[name].profileFields[fieldName] = true;
            },
            getProfile: user => this.getProfile(user),
            getUserById: (id) => this.backend.getUserById(id),
            getUserByUniqueField: this.getUserByUniqueField,
            getUniqueField: (user, fieldName) => {
                if (this.uniqueFields[fieldName]) {
                    for (const strategyName of Object.keys(this.uniqueFields[fieldName])) {
                        const actualFieldName = this.uniqueFields[fieldName][strategyName]
                        if (user[strategyName] && user[strategyName][actualFieldName]) {
                            return user[strategyName][actualFieldName]
                        }
                    }
                }
                return null
            },
            getUserByFields: async (fields) => {
                const actualFields = {}
                Object.keys(fields).forEach(field => {
                    actualFields[`${name}.${field}`] = fields[field]
                })
                return await this.backend.getUser(actualFields)
            },
            updateUser: async (id, fields) => {
                return await this.updateUserStrategy(name, id, fields)
            },
            insertUser: async (fields) => {
                return await this.insertUser(name, fields)
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
        const middleware = handlers.slice(0, -1)
        const handler = handlers[handlers.length - 1]

        const methodName = strategy !== 'root' ? `${strategy}-${method}` : method
        const routeName = strategy !== 'root' ? `/${strategy}/${method}` : `/${method}`

        passport.use(methodName, handler)
        post(this.route, routeName, ...middleware, async (req, res) => {
            const user = await authenticate(passport, methodName, req, res)

            await login(req, user)

            const profile = this.getProfile(user)

            this.sendStatus(req, {
                user: profile
            })

            if (this.onLogin) {
                this.onLogin(profile)
            }

            if (this.standalone) {
                return {
                    user: profile,
                    token: this.getToken(profile)
                }
            }

            return {
                user: profile
            }
        })
    }


    registerPassportConnectMethod(strategy, method, ...handlers) {
        this.strategies[strategy].methods.push(method)

        // Split handlers into [...middleware, handler]
        const middleware = handlers.slice(0, -1)
        const handler = handlers[handlers.length - 1]

        const methodName = strategy !== 'root' ? `${strategy}-${method}` : method
        const routeName = strategy !== 'root' ? `/${strategy}/${method}` : `/${method}`

        passport.use(methodName, handler)
        post(this.route, routeName, ...middleware, async (req, res) => {
            const userPart = await authenticate(passport, methodName, req, res)

            if (!userPart) {
                throw new Error('Strategy should return an object.')
            }

            let user
            for (const field of Object.keys(this.strategies[strategy].uniqueFields)) {
                const value = userPart[field]
                if (value) {
                    const userCandidate = await this.backend.getUser({
                        [`${strategy}.${field}`]: value,
                    })
                    if (!user || user._id === userCandidate._id) {
                        user = userCandidate
                    } else {
                        throw new Error('Multiple users conform to this authentication.')
                    }
                }
            }
            for (const field of Object.keys(this.uniqueFields)) {
                if (this.uniqueFields[field][strategy]) {
                    const value = userPart[this.uniqueFields[field][strategy]]
                    if (value) {
                        const userCandidate = await this.getUserByUniqueField(field, value)
                        if (!user || user._id === userCandidate._id) {
                            user = userCandidate
                        } else {
                            throw new Error('Multiple users conform to this authentication.')
                        }
                    }
                }
            }

            let registered = false
            if (req.user) {
                // User is already logged in

                if (user && user._id !== req.user._id) {
                    throw new Error('This authentication strategy belongs to another account.')
                }

                // Update user
                await this.updateUserStrategy(strategy, req.user._id, userPart)
                user = await this.backend.getUserById(req.user._id)
            } else {
                // User hasn't logged in

                if (user) {
                    // User exists already, update
                    await this.updateUserStrategy(strategy, user._id, userPart)
                    user = await this.backend.getUserById(user._id)
                } else {
                    // Need to create a new user
                    const _id = await this.insertUser(strategy, userPart)
                    user = await this.backend.getUserById(_id)
                    registered = true
                }
            }

            let loggedIn = false
            if (!req.user) {
                await login(req, user)
                loggedIn = true
            }

            const profile = this.getProfile(user)

            this.sendStatus(req, {
                user: profile
            })

            if (loggedIn && this.onLogin) {
                this.onLogin(profile)
            }
            if (registered && this.onRegister) {
                this.onRegister(profile)
            }

            if (this.standalone) {
                return {
                    user: profile,
                    token: this.getToken(profile)
                }
            }

            return {
                user: profile
            }
        })
    }
}

module.exports = Ooth