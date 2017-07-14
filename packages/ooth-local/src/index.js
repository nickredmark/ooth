const { hashSync, compareSync } = require('bcrypt')
const { randomBytes } = require('crypto')
const LocalStrategy = require('passport-local').Strategy
const nodeify = require('nodeify')

const SALT_ROUNDS = 10

function randomToken() {
    return randomBytes(43).toString('hex')
}

function nodeifyAsync(asyncFunction) {
    return function(...args) {
        return nodeify(asyncFunction(...args.slice(0, -1)), args[args.length - 1])
    }
}

module.exports = function({
    onRegister,
    onGenerateVerificationToken,
    onSendVerificationEmail,
    onVerify,
    onForgotPassword,
    onResetPassword,
    onChangePassword
}) {
    return function({
        name,
        registerPassportMethod,
        registerMethod,
        registerUniqueField,
        registerProfileField,
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

        registerUniqueField('username', 'username')
        registerUniqueField('email', 'email')
        registerProfileField('username')
        registerProfileField('email')
        registerProfileField('verified')

        registerPassportMethod('login', requireNotLogged, new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password'
        }, nodeifyAsync((username, password) => {
            return getUserByUniqueField('username', username)
                .then(user => {
                    if (!user) {
                        return getUserByUniqueField('email', username)
                    } else {
                        return user
                    }
                }).then(user => {
                    if (!user) {
                        throw new Error('Incorrect email or username.')
                    }

                    if (!compareSync(password, user[name].password)) {
                        throw new Error('Incorrect password.')
                    }

                    return user
                })
        })))

        registerMethod('set-username', requireLogged, function(req, res) {
            const { username } = req.body

            if (typeof username !== 'string') {
                return res.status(400).send({
                    status: 'error',
                    message: 'Invalid username'
                })
            }

            if (!/^[a-z][0-9a-z]{3,19}$/.test(username)) {
                return res.status(400).send({
                    status: 'error',
                    message: 'Username must be all lowercase, contain only letters and numbers (starting with a letter), and be between 4 and 20 digits long.'
                })
            }

            getUserByUniqueField('username', username)
                .then(user => {
                    if (user) {
                        return res.status(400).send({
                            status: 'error',
                            message: 'This username is already registered.'
                        })
                    }

                    updateUser(req.user._id, {
                        username
                    }).then(() => {

                        return res.send({
                            message: 'Username updated.'
                        })
                    })
                })
        })

        registerMethod('register', requireNotLogged, function(req, res) {
            const { email, password } = req.body

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

            if (!/\d/.test(password) || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/.{6,}/.test(password)) {
                return res.status(400).send({
                    status: 'error',
                    message: 'Password must contain digits, lowercase and uppercase letters and be at least 6 characters long.'
                })
            }

            getUserByUniqueField('email', email)
                .then(user => {
                    if (user) {
                        return res.status(400).send({
                            status: 'error',
                            message: 'This email is already registered.'
                        })
                    }

                    const verificationToken = randomToken()

                    insertUser({
                        email,
                        password: hashSync(password, SALT_ROUNDS),
                        verificationToken
                    }).then(_id => {
                        if (onRegister) {
                            onRegister({
                                _id,
                                email,
                                verificationToken
                            })
                        }
                    })

                    res.send({
                        message: 'User registered successfully.'
                    })
                })
        })

        registerMethod('generate-verification-token', requireRegisteredWithThis, function(req, res) {
            const verificationToken = randomToken()

            const user = req.user

            updateUser(req.user._id, {
                verificationToken
            }).then(() => {
                if (onGenerateVerificationToken) {
                    onGenerateVerificationToken({
                        _id: user._id,
                        email: user[name].email,
                        verificationToken
                    })
                }

                res.send({
                    message: 'Message token generated'
                })
            })
        })

        registerMethod('verify', function(req, res) {
            if (!req.body.token) {
                return res.status(400).send({
                    status: 'error',
                    message: 'Verification token required.'
                })
            }

            getUserByFields({
                verificationToken: req.body.token
            }).then(user => {
                if (!user) {
                    return res.status(400).send({
                        status: 'error',
                        message: 'Verification token invalid, expired or already used.'
                    })
                }

                return updateUser(user._id, {
                    verified: true,
                    verificationToken: null
                }).then(() => {

                    if (onVerify) {
                        onVerify({
                            _id: user._id,
                            email: user[name].email
                        })
                    }

                    return res.send({
                        message: 'Email verified'
                    })
                })
            }).catch(e => {
                return res.status(500).send({
                    status: 'error',
                    message: e.message
                })
            })
        })

        registerMethod('forgot-password', requireNotLogged, function(req, res) {
            const { username } = req.body

            if (!username || typeof username !== 'string') {
                res.status(400).send({
                    status: 'error',
                    message: 'Invalid email.'
                })
            }

            getUserByUniqueField('username', username)
                .then(user => {
                    if (!user) {
                        return getUserByUniqueField('email', username)
                    }
                }).then(user => {
                    if (!user) {
                        res.status(400).send({
                            status: 'error',
                            message: 'Invalid username or email.'
                        })
                    }

                    const passwordResetToken = randomToken()

                    updateUser(user._id, {
                        passwordResetToken
                    }).then(() => {

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
                    })
                })
        })

        registerMethod('reset-password', requireNotLogged, function(req, res) {
            const { token, newPassword } = req.body
            if (!newPassword || !typeof newPassword === 'string') {
                return res.status(400).send({
                    status: 'error',
                    message: 'Invalid password.'
                })
            }

            if (!/\d/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/.{6,}/.test(newPassword)) {
                return res.status(400).send({
                    status: 'error',
                    message: 'Password must contain digits, lowercase and uppercase letters and be at least 6 characters long.'
                })
            }

            getUserByFields({
                passwordResetToken: token
            }).then(user => {
                if (!user) {
                    return res.status(400).send({
                        status: 'error',
                        message: 'Invalid password reset token.'
                    })
                }
                updateUser(user._id, {
                    passwordResetToken: null,
                    password: hashSync(newPassword, SALT_ROUNDS)
                }).then(() => {
                    if (onResetPassword) {
                        onResetPassword({
                            _id: user._id,
                            email: user[name].email
                        })
                    }
                    return res.send({
                        message: 'Password has been reset.'
                    })
                })
            })
        })

        registerMethod('change-password', requireLogged, function(req, res) {
            const { password, newPassword } = req.body

            if (!typeof password === 'string') {
                return res.status(400).send({
                    status: 'error',
                    message: 'Invalid password.'
                })
            }

            if (!/\d/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/.{6,}/.test(newPassword)) {
                return res.status(400).send({
                    status: 'error',
                    message: 'Password must contain digits, lowercase and uppercase letters and be at least 6 characters long.'
                })
            }

            getUserById(req.user._id)
                .then(user => {
                    if (!compareSync(password, user[name].password)) {
                        return res.status(400).send({
                            status: 'error',
                            message: 'Incorrect password'
                        })
                    }

                    updateUser(user._id, {
                        passwordResetToken: null,
                        password: hashSync(newPassword, SALT_ROUNDS)
                    }).then(() => {
                        if (onChangePassword) {
                            onChangePassword({
                                _id: user._id,
                                email: user[name].email
                            })
                        }
                        return res.send({
                            message: 'Password has been changed.'
                        })
                    })
                })
        })

    }
}