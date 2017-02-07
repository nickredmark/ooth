const {hashSync, compareSync} = require('bcrypt')
const {randomBytes} = require('crypto')
const LocalStrategy = require('passport-local').Strategy
const nodeify = require('nodeify')

const SALT_ROUNDS = 10

function randomToken() {
    return randomBytes(43).toString('hex')
}

function nodeifyAsync(asyncFunction) {
    return function(...args) {
        return nodeify(asyncFunction(...args.slice(0, -1)), args[args.length-1])
    }
}

module.exports = function({
    onRegister,
    onGenerateVerificationToken,
    onVerify,
    onForgotPassword,
    onResetPassword
}) {
    return function({
        name,
        registerPassportMethod,
        registerMethod,
        registerUniqueField,
        getUserByUniqueField,
        getUserById,
        getUserByFields,
        updateUser,
        insertUser,
        requireLogged,
        requireNotLogged,
        requireNotRegistered,
        requireRegisteredWithThis
    }) {

        registerUniqueField('email', 'email')

        registerPassportMethod('login', requireNotLogged, new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password'
        }, nodeifyAsync(async (email, password) => {
            const user = await getUserByUniqueField('email', email)
            if (!user) {
                throw new Error('Incorrect email')
            }
            if (!compareSync(password, user[name].password)) {
                throw new Error('Incorrect password.')
            }
            return {
                _id: user._id
            }
        })))

        registerMethod('register', requireNotLogged, function(req, res) {
            return (async () => {
                const {email, password} = req.body

                if (typeof email !== 'string') {
                    return res.status(400).send({
                        status: 'error',
                        message: 'Invalid email'
                    })
                }
                if (typeof password !== 'string') {
                    return res.status(400).send({
                        status: 'error',
                        message: 'Invalid email'
                    })
                }

                let user = await getUserByUniqueField('email', email)

                if (user) {
                    return res.status(400).send({
                        status: 'error',
                        message: 'This email is already registered.'
                    })
                }

                const verificationToken = randomToken()

                const _id = insertUser({
                    email,
                    password: hashSync(password, SALT_ROUNDS),
                    verificationToken
                })
                
                if (onRegister) {
                    onRegister({
                        _id,
                        email,
                        verificationToken
                    })
                }

                res.send({
                    message: 'User registered successfully.'
                })
            })()
        })

        registerMethod('generate-verification-token', requireRegisteredWithThis, function(req, res) {
            return (async () => {
                const verificationToken = randomToken()

                updateUser(req.user._id, {
                    verificationToken
                })


                if (onGenerateVerificationToken) {
                    const user = await getUserById(req.user._id)
                    onGenerateVerificationToken({
                        _id: user._id,
                        email: user[name].email,
                        verificationToken
                    })
                }

                res.send({
                    message: 'Message token generated'
                })
            })()
        })

        registerMethod('verify', function(req, res) {
            return (async () => {
                try {
                    if (!req.body.token) {
                        return res.status(400).send({
                            status: 'error',
                            message: 'Verification token required'
                        })
                    }

                    const user = await getUserByFields({
                        verificationToken: req.body.token
                    })

                    if (!user) {
                        return res.status(400).send({
                            status: 'error',
                            message: 'Verification token invalid'
                        })
                    }

                    await updateUser(user._id, {
                        verified: true,
                        verificationToken: null
                    })

                    if (onVerify) {
                        onVerify({
                            _id: user._id,
                            email: user[name].email
                        })
                    }

                    return res.send({
                        message: 'Email verified'
                    })
                } catch (e) {
                    return res.status(500).send({
                        status: 'error',
                        message: e.message
                    })
                }
            })()
        })

        registerMethod('forgot-password', requireNotLogged, function(req, res) {
            return (async () => {
                const {email} = req.body

                if (!email || typeof email !== 'string') {
                    res.status(400).send({
                        status: 'error',
                        message: 'Invalid email.'
                    })
                }

                const user = await getUserByUniqueField('email', email)

                if (!user) {
                    res.status(400).send({
                        status: 'error',
                        message: 'Invalid email.'
                    })
                }

                const passwordResetToken = randomToken()

                updateUser(user._id, {
                    passwordResetToken
                })

                if (onForgotPassword) {
                    onForgotPassword({
                        _id: user._id,
                        email: user[name].email,
                        passwordResetToken
                    })

                }

                return res.send({
                    message: 'Password reset token generated'
                })
           })()
        })

        registerMethod('reset-password', requireNotLogged, function(req, res) {
            return (async () => {
                const {token, newPassword} = req.body
                if (!newPassword || !typeof newPassword === 'string') {
                    return res.status(400).send({
                        status: 'error',
                        message: 'Invalid password'
                    })
                }
                const user = await getUserByFields({
                    passwordResetToken: token
                })
                if (!user) {
                    return res.status(400).send({
                        status: 'error',
                        message: 'Invalid password reset token'
                    })
                }
                await updateUser(user._id, {
                    passwordResetToken: null,
                    password: hashSync(newPassword, SALT_ROUNDS)
                })
                if (onResetPassword) {
                    onResetPassword({
                        _id: user._id,
                        email: user[name].email
                    })
                }
                return res.send({
                    message: 'Password has been reset.'
                })
            })()
        })

    }
}