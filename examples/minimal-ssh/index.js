const {MongoClient, ObjectId} = require('mongodb')
const express = require('express')
const session = require('express-session')
const {promisify} = require('util')
const Ooth = require('ooth')
const oothLocal = require('ooth-local')
const OothMongo = require('ooth-mongo')
const https = require('https')
const fs = require('fs')

const MONGO_HOST = 'mongodb://localhost:27017'
const MONGO_DB = 'ooth-minimal'
const HOST = 'https://localhost'
const PORT = 3000
const SECRET = 'somesecret'
const SHARED_SECRET = 'somesharedsecret'
const OOTH_PATH = '/auth'

const start = async () => {
    try {
        const client = await MongoClient.connect(MONGO_HOST)
        const db = client.db(MONGO_DB)
    
        const app = express()
        app.use(session({
            name: 'api-session-id',
            secret: SECRET,
            resave: false,
            saveUninitialized: true,
        }))

        const ooth = new Ooth({
            sharedSecret: SHARED_SECRET,
            path: OOTH_PATH,
        })
        const oothMongo = new OothMongo(db, ObjectId)
        await ooth.start(app, oothMongo)
        ooth.use('local', oothLocal({
            onRegister({email, verificationToken}) {
                console.log(`Someone registered.`)
            },
            onGenerateVerificationToken({email, verificationToken}) {
                console.log(`Someone requested a verification email.`)
            },
            onVerify({email}) {
                console.log(`Someone verified their email`)
            },
            onForgotPassword({email, passwordResetToken}) {
                console.log(`Someone forgot their password`)
            },
            onResetPassword({email}) {
                console.log(`Someone reset their password`)
            },
        }))

        app.get('/', (req, res) => res.sendFile(`${__dirname}/index.html`))

        const server = https.createServer({
            key: fs.readFileSync('keys/key.pem'),
            cert: fs.readFileSync('keys/cert.pem'),
        }, app)

        await server.listen(PORT, () => {
            console.info(`Online at ${HOST}:${PORT}`)
        })
    } catch (e) {
        console.error(e)
    }
}

start()