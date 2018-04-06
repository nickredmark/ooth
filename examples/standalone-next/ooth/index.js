const express = require('express')
const Ooth = require('ooth')
const OothMongo = require('ooth-mongo')
const oothGuest = require('ooth-guest')
const oothLocal = require('ooth-local')
const emailer = require('ooth-local-emailer')
const morgan = require('morgan')
const cors = require('cors')
const mail = require('./mail')
const settings = require('config')
const session = require('express-session')
const {MongoClient, ObjectId} = require('mongodb')

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

        ooth.use('guest', oothGuest())
        ooth.use('local', oothLocal(emailer({
            ...settings.mail,
            sendMail: mail(settings.mailgun)
        })))

        app.listen(settings.port, function() {
            console.info(`Ooth started on port ${settings.port}`)
        })

    } catch (e) {
        console.error(e)
    }
}

start()