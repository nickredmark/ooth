const express = require('express')
const Ooth = require('ooth')
const OothMongo = require('ooth-mongo')

const morgan = require('morgan')
const cors = require('cors')
const mail = require('./mail')
const settings = require('./config/settings.js')
const session = require('express-session')
const {MongoClient, ObjectId} = require('mongodb')
const strategies = require('./config/strategies.js')

async function start() {
    try {

        const app = express()
        app.use(morgan('dev'))
        const corsMiddleware = cors({
            origin: settings.originUrl,
            credentials: true,
            preflightContinue: false
        })
        app.use(corsMiddleware)
        app.options(corsMiddleware)

        app.use(session({
            name: 'ooth-session-id',
            secret: settings.sessionSecret,
            resave: false,
            saveUninitialized: true,
        }))

        const ooth = new Ooth({
            standalone: true,
            sharedSecret: settings.sharedSecret
        })
        const db = await MongoClient.connect(settings.mongoUrl)
        const oothMongo = new OothMongo(db, ObjectId)
        await ooth.start(app, oothMongo)

        strategies(settings).forEach(strategy => {
            const {name, methods} = strategy;
            ooth.use(name, methods)
        })

        const sendMail = mail(settings.mailgun)

        app.listen(settings.port, function() {
            console.info(`Ooth started on port ${settings.port}`)
        })

    } catch (e) {
        console.error(e)
    }
}

start()