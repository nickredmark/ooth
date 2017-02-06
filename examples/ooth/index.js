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

async function start() {

    try {

        const app = express()
        app.use(morgan('dev'))
        app.use(cors())

        const ooth = new Ooth({
            mongoUrl: settings.mongoUrl,
            sharedSecret: settings.sharedSecret
        })

        await ooth.start(app)

        ooth.use('guest', oothGuest())

        const sendMail = mail(settings.mailgun)
        ooth.use('local', oothLocal({
            onRegister({email, verificationToken}) {
                sendMail({
                    from: settings.from,
                    to: email,
                    subject: 'Welcome',
                    body: `Thank you for registering to our pretty website!`,
                })
                sendMail({
                    from: settings.from,
                    to: email,
                    subject: 'Verify your email address',
                    body: `Please verify your email address with the token ${verificationToken}.`,
                })
            },
            onGenerateVerificationToken({email, verificationToken}) {
                sendMail({
                    from: settings.from,
                    to: email,
                    subject: 'Verify your email address',
                    body: `Please verify your email address with the token ${verificationToken}.`,
                })
            },
            onVerify({email}) {
                sendMail({
                    from: settings.from,
                    to: email,
                    subject: 'Address verified',
                    body: `Your email address has been verified.`,
                })
            },
            onResetPassword({email, resetPasswordToken}) {
                sendMail({
                    from: settings.from,
                    to: email,
                    subject: 'Reset password',
                    body: `Reset your password with this token ${resetPasswordToken}.`,
                })
            },
        }))

        //ooth.use('facebook', oothFacebook(settings.facebook))

        //ooth.use('google', oothGoogle(settings.google))

        app.listen(settings.port, function() {
            console.log(`Ooth started on port ${settings.port}`)
        })

    } catch (e) {
        console.log(e)
    }
}

start()