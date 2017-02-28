const express = require('express')
const Ooth = require('ooth')
const oothGuest = require('ooth-guest')
const oothLocal = require('ooth-local')
//const oothFacebook = require('ooth-facebook')
//const oothGoogle = require('ooth-google')
const morgan = require('morgan')
const cors = require('cors')
const mail = require('./mail')
const settings = require('./settings')
const session = require('express-session')

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
            mongoUrl: settings.mongoUrl,
            sharedSecret: settings.sharedSecret
        })
        await ooth.start(app)

        ooth.use('guest', oothGuest())

        const sendMail = mail(settings.mailgun)
        ooth.use('local', oothLocal({
            onRegister({email, verificationToken}) {
                sendMail({
                    from: settings.mail.from,
                    to: email,
                    subject: 'Welcome',
                    body: `Thank you for registering to our pretty website!`,
                    html: `Thank you for registering to our pretty website!`,
                })
                sendMail({
                    from: settings.mail.from,
                    to: email,
                    subject: 'Verify your email address',
                    body: `Please verify your email address with the token ${verificationToken}.`,
                    html: `Please verify your email address with the token ${verificationToken}.`,
                })
            },
            onGenerateVerificationToken({email, verificationToken}) {
                sendMail({
                    from: settings.mail.from,
                    to: email,
                    subject: 'Verify your email address',
                    body: `Please verify your email address with the token ${verificationToken}.`,
                    html: `Please verify your email address with the token ${verificationToken}.`,
                })
            },
            onVerify({email}) {
                sendMail({
                    from: settings.mail.from,
                    to: email,
                    subject: 'Address verified',
                    body: `Your email address has been verified.`,
                    html: `Your email address has been verified.`,
                })
            },
            onForgotPassword({email, passwordResetToken}) {
                sendMail({
                    from: settings.mail.from,
                    to: email,
                    subject: 'Reset password',
                    body: `Reset your password with this token ${passwordResetToken}.`,
                    html: `Reset your password with this token ${passwordResetToken}.`,
                })
            },
            onResetPassword({email}) {
                sendMail({
                    from: settings.mail.from,
                    to: email,
                    subject: 'Password has been reset',
                    body: 'Your password has been reset.',
                    html: 'Your password has been reset.'
                })
            }
        }))

        //ooth.use('facebook', oothFacebook(settings.facebook))

        //ooth.use('google', oothGoogle(settings.google))

        app.listen(settings.port, function() {
            console.info(`Ooth started on port ${settings.port}`)
        })

    } catch (e) {
        console.error(e)
    }
}

start()