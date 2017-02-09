const {MongoClient, ObjectId} = require('mongodb')
const express = require('express')
const bodyParser = require('body-parser')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const {graphqlExpress, graphiqlExpress} = require('graphql-server-express')
const {makeExecutableSchema} = require('graphql-tools')
const morgan = require('morgan')
const cors = require('cors')
const settings = require('./settings')
const passport = require('passport')
const nodeify = require('nodeify')
const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt

const prepare = (o) => {
    o._id = o._id.toString()
    return o
}

function nodeifyAsync(asyncFunction) {
    return function(...args) {
        return nodeify(asyncFunction(...args.slice(0, -1)), args[args.length-1])
    }
}

function setupAuthEndpoints(app) {
    app.use(cookieParser())
    app.use(session({
        secret: settings.sessionSecret,
        resave: false,
        saveUninitialized: true,
    }))
    app.use(passport.initialize())
    app.use(passport.session())
    passport.serializeUser((userId, done) => {
        done(null, userId)
    })
    passport.deserializeUser((userId, done) => {
        done(null, userId)
    })
    passport.use('jwt', new JwtStrategy({
        secretOrKey: settings.sharedSecret,
        jwtFromRequest: ExtractJwt.fromAuthHeader()
    }, nodeifyAsync(async (payload) => {
        console.log(payload)
        if (!payload.user || !payload.user._id || typeof payload.user._id !== 'string') {
            console.error(payload)
            throw new Error('Malformed token payload.')
        }
        return payload.user._id
    })))
    app.post('/login', passport.authenticate('jwt'), (req, res) => {
        res.send({
            user: {
                _id: req.user
            },
            message: 'Logged in successfully.'
        })
    })
    app.post('/logout', (req, res) => {
        req.logout()
        res.send({
            message: 'Logged out successfully.'
        })
    })
}

const start = async () => {
    try {
        const db = await MongoClient.connect(settings.mongoUrl)

        const Posts = db.collection('posts')
        const Comments = db.collection('comments')

        const typeDefs = [`
            type Query {
                post(_id: ID!): Post
                posts: [Post]
                comment(_id: ID!): Comment
            }
            type Post {
                _id: ID!
                authorId: ID!
                title: String
                content: String
                comments: [Comment]
            }
            type Comment {
                _id: ID!
                postId: ID!
                authorId: ID
                content: String
                post: Post
            }
            type Mutation {
                createPost(title: String, content: String): Post
                createComment(postId: ID!, content: String): Comment
            }
            schema {
                query: Query
                mutation: Mutation
            }
        `];        


        const resolvers = {
            Query: {
                post: async (root, {_id}) => {
                    return prepare(await Posts.findOne(ObjectId(_id)))
                },
                posts: async (root, args, context) => {
                    return (await Posts.find({}).toArray()).map(prepare)
                },
                comment: async (root, {_id}) => {
                    return prepare(await Comments.findOne(ObjectId(_id)))
                },
            },
            Post: {
                comments: async ({_id}) => {
                    return (await Comments.find({postId: _id}).toArray()).map(prepare)
                }
            },
            Comment: {
                post: async ({postId}) => {
                    return prepare(await Posts.findOne(ObjectId(postId)))
                }
            },
            Mutation: {
                createPost: async (root, args, {userId}, info) => {
                    if (!userId) {
                        throw new Error('User not logged in.')
                    }
                    const res = await Posts.insert(args)
                    return prepare(await Posts.findOne({_id: res.insertedIds[1]}))
                },
                createComment: async (root, args, {userId}) => {
                    if (!userId) {
                        throw new Error('User not logged in.')
                    }
                    const res = await Comments.insert(args)
                    return prepare(await Comments.findOne({_id: res.insertedIds[1]}))
                },
            },
        }

        const schema = makeExecutableSchema({
            typeDefs,
            resolvers
        })

        const app = express()
        app.use(morgan('dev'))
        app.use(cors())

        setupAuthEndpoints(app)

        app.use('/graphql', bodyParser.json(), graphqlExpress((req, res) => ({
            schema,
            context: { userId: req.user }
        })))

        app.use('/graphiql', graphiqlExpress({
            endpointURL: '/graphql',
        }))

        app.listen(settings.port, () => {
            console.log(`Visit ${settings.url}:${settings.port}`)
        })

    } catch (e) {
        console.log(e)
    }
}

start()