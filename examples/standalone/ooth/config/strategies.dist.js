const oothGuest = require('ooth-guest')
const oothLocal = require('ooth-local')

const strategies = function (settings) {
    return [{
        name: 'local',
        methods:
            oothLocal({
                onRegister({ email, verificationToken }) {
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
                onGenerateVerificationToken({ email, verificationToken }) {
                    sendMail({
                        from: settings.mail.from,
                        to: email,
                        subject: 'Verify your email address',
                        body: `Please verify your email address with the token ${verificationToken}.`,
                        html: `Please verify your email address with the token ${verificationToken}.`,
                    })
                },
                onVerify({ email }) {
                    sendMail({
                        from: settings.mail.from,
                        to: email,
                        subject: 'Address verified',
                        body: `Your email address has been verified.`,
                        html: `Your email address has been verified.`,
                    })
                },
                onForgotPassword({ email, passwordResetToken }) {
                    sendMail({
                        from: settings.mail.from,
                        to: email,
                        subject: 'Reset password',
                        body: `Reset your password with this token ${passwordResetToken}.`,
                        html: `Reset your password with this token ${passwordResetToken}.`,
                    })
                },
                onResetPassword({ email }) {
                    sendMail({
                        from: settings.mail.from,
                        to: email,
                        subject: 'Password has been reset',
                        body: 'Your password has been reset.',
                        html: 'Your password has been reset.'
                    })
                }
            })
    },
    {
        name: 'guest',
        methods: oothGuest()
    }]
}
module.exports = strategies
