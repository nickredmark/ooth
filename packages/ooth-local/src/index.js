const { hashSync, compareSync, genSaltSync } = require('bcrypt-nodejs')
const { randomBytes } = require('crypto')
const LocalStrategy = require('passport-local').Strategy
const nodeify = require('nodeify')
const { getI18n } = require('ooth-i18n')

const SALT_ROUNDS = 12
const HOUR = 1000 * 60 * 60
const DEFAULT_LANGUAGE = 'en'
const DEFAULT_TRANSLATIONS = {
    en: require('../i18n/en.json')
}
const DEFAULT_VALIDATORS = {
    username: {
        regex: /^[a-z][0-9a-z_]{3,19}$/,
        error: 'validators.invalid_username',
    },
    password: {
        test: (password) => /\d/.test(password) && /[a-z]/.test(password) && /[A-Z]/.test(password) && /.{6,}/.test(password),
        error: 'validators.invalid_password',
    },
    email: {
        regex: /^.+@.+$/,
        error: 'validators.invalid_email',
    }
}

function randomToken() {
    return randomBytes(43).toString('hex')
}

function nodeifyAsync(asyncFunction) {
    return function(...args) {
        return nodeify(asyncFunction(...args.slice(0, -1)), args[args.length - 1])
    }
}

function hash(pass) {
    return hashSync(pass, genSaltSync(SALT_ROUNDS))
}

module.exports = function({
    onRegister,
    onGenerateVerificationToken,
    onSetEmail,
    onVerify,
    onForgotPassword,
    onResetPassword,
    onChangePassword,
    defaultLanguage,
    translations,
    validators,
}) {
    const __ = getI18n(translations || DEFAULT_TRANSLATIONS, defaultLanguage || DEFAULT_LANGUAGE)
    const actualValidators = { ...DEFAULT_VALIDATORS, ...validators }

    function testValue(key, value, language) {
        const test = actualValidators[key]
        if (test.regex) {
            if (!test.regex.test(value)) {
                throw new Error(__(test.error, null, language))
            }
        } else {
            if (!test.test(value)) {
                throw new Error(__(test.error, null, language))
            }
        }
    }
    
    return function({
        name,
        registerPassportMethod,
        registerMethod,
        registerUniqueField,
        registerProfileField,
        getProfile,
        getUserByUniqueField,
        getUserById,
        getUserByFields,
        getUniqueField,
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
            passwordField: 'password',
            passReqToCallback: true,
        }, nodeifyAsync((req, username, password) => {
            return getUserByUniqueField('username', username)
                .then(user => {
                    if (!user) {
                        return getUserByUniqueField('email', username)
                    } else {
                        return user
                    }
                }).then(user => {
                    if (!user) {
                        throw new Error(__('login.no_user', null, req.locale))
                    }

                    if (!user[name]) {
                        throw new Error(__('login.no_password', null, req.locale))
                    }

                    if (!compareSync(password, user[name].password)) {
                        throw new Error(__('login.invalid_password', null, req.locale))
                    }

                    return user
                })
        })))

        registerMethod('set-username', requireLogged, function(req, res) {
            const { username } = req.body

            if (typeof username !== 'string') {
                throw new Error(__('set_username.invalid_username', null, req.locale))
            }

            testValue('username', username, req.locale)

            return getUserByUniqueField('username', username)
                .then(user => {
                    if (user) {
                        throw new Error(__('username_taken.invalid_username', null, req.locale))
                    }

                    updateUser(req.user._id, {
                        username
                    }).then(() => {
                        return getUserById(req.user._id)
                    }).then(user => {
                        return res.send({
                            message: __('set_username.username_updated', null, req.locale),
                            user: getProfile(user)
                        })
                    })
                })
        })

        registerMethod('set-email', requireLogged, function(req, res) {
            const { email } = req.body

            if (typeof email !== 'string') {
                throw new Error(__('set_email.invalid_email', null, req.locale))
            }

            testValue('email', email, req.locale)

            return getUserByUniqueField('email', email)
                .then(user => {
                    if (user && user._id !== req.user._id) {
                        throw new Error(__('set_email.email_already_registered', null, req.locale))
                    }

                    const verificationToken = randomToken()

                    updateUser(req.user._id, {
                        email,
                        verificationToken: hash(verificationToken),
                        verificationTokenExpiresAt: new Date(Date.now() + HOUR)
                    }).then(() => {
                        if (onSetEmail) {
                            onSetEmail({
                                _id: req.user._id,
                                email,
                                verificationToken
                            })
                        }
                        return getUserById(req.user._id)
                    }).then(user => {
                        return res.send({
                            message: __('set_email.email_updated', null, req.locale),
                            user: getProfile(user)
                        })
                    })
                })
        })

        registerMethod('register', requireNotLogged, function(req, res) {
            const { email, password } = req.body

            if (typeof email !== 'string') {
                throw new Error(__('register.invalid_email', null, req.locale))
            }
            if (typeof password !== 'string') {
                throw new Error(__('register.invalid_password', null, req.locale))
            }

            testValue('password', password, req.locale)

            return getUserByUniqueField('email', email)
                .then(user => {
                    if (user) {
                        throw new Error(__('register.email_already_registered', null, req.locale))
                    }

                    const verificationToken = randomToken()

                    return insertUser({
                        email,
                        password: hash(password),
                        verificationToken: hash(verificationToken),
                        verificationTokenExpiresAt: new Date(Date.now() + HOUR),
                    })
                }).then(_id => {
                    if (onRegister) {
                        onRegister({
                            _id,
                            email,
                            verificationToken
                        })
                    }

                    res.send({
                        message: __('register.registered', null, req.locale)
                    })
                })
        })

        registerMethod('generate-verification-token', requireRegisteredWithThis, function(req, res) {
            const verificationToken = randomToken()

            const user = req.user

            if (!user[name] || !user[name].email) {
                throw new Error(__('generate_verification_token.no_email', null, req.locale))
            }

            return updateUser(req.user._id, {
                verificationToken: hash(verificationToken),
                verificationTokenExpiresAt: new Date(Date.now() + HOUR),
            }).then(() => {
                if (onGenerateVerificationToken) {
                    onGenerateVerificationToken({
                        _id: user._id,
                        email: user[name].email,
                        verificationToken,
                    })
                }

                res.send({
                    message: __('generate_verification_token.token_generated', null, req.locale)
                })
            })
        })

        registerMethod('verify', function(req, res) {

            const { userId, token } = req.body

            if (!userId) {
                throw new Error(__('verify.no_user_id', null, req.locale))
            }

            if (!token) {
                throw new Error(__('verify.token_generated', null, req.locale))
            }
            
            return getUserById(userId)
                .then(user => {
                    
                    if (!user) {
                        throw new Error(__('verify.no_user', null, req.locale))
                    }
                    
                    if (!user[name] || !user[name].email) {
                        // No email to verify, but let's not leak this information
                        throw new Error(__('verify.no_email', null, req.locale))
                    }
                    
                    if (!compareSync(token, user[name].verificationToken)) {
                        throw new Error(__('verify.invalid_token', null, req.locale))
                    }

                    if (!user[name].verificationTokenExpiresAt) {
                        throw new Error(__('verify.no_expiry', null, req.locale))
                    }

                    if (new Date() >= user[name].verificationTokenExpiresAt) {
                        throw new Error(__('verify.expired_token', null, req.locale))
                    }
                    
                    return updateUser(user._id, {
                        verified: true,
                        verificationToken: null
                    }).then(() => {
                        return getUserById(user._id)
                    }).then(user => {

                        if (onVerify) {
                            onVerify({
                                _id: user._id,
                                email: user[name].email
                            })
                        }

                        return res.send({
                            message: __('verify.verified', null, req.locale),
                            user: getProfile(user)
                        })
                    })
                })
        })

        registerMethod('forgot-password', requireNotLogged, function(req, res) {
            const { username } = req.body

            if (!username || typeof username !== 'string') {
                throw new Error(__('forgot_password.invalid_username', null, req.locale))
            }

            return getUserByUniqueField('username', username)
                .then(user => {
                    if (!user) {
                        return getUserByUniqueField('email', username)
                    }

                    return user;
                }).then(user => {
                    if (!user) {
                        throw new Error(__('forgot_password.no_user', null, req.locale))
                    }

                    const email = getUniqueField(user, 'email')

                    const passwordResetToken = randomToken()

                    updateUser(user._id, {
                        passwordResetToken: hash(passwordResetToken),
                        passwordResetTokenExpiresAt: new Date(Date.now() + HOUR),
                        email,
                    }).then(() => {

                        if (onForgotPassword) {
                            onForgotPassword({
                                _id: user._id,
                                email,
                                passwordResetToken
                            })
                        }

                        return res.send({
                            message: __('forgot_password.token_generated', null, req.locale)
                        })
                    })
                })
        })

        registerMethod('reset-password', requireNotLogged, function(req, res) {
            const { userId, token, newPassword } = req.body

            if (!userId) {
                throw new Error(__('reset_password.no_user_id', null, req.locale))
            }

            if (!token) {
                throw new Error(__('reset_password.no_token', null, req.locale))
            }

            if (!newPassword || !typeof newPassword === 'string') {
                throw new Error(__('reset_password.invalid_password', null, req.locale))
            }

            testValue('password', newPassword, req.locale)

            return getUserById(userId)
                .then(user => {
                    if (!user) {
                        throw new Error('User does not exist.')
                    }

                    if (!user[name] || !user[name].passwordResetToken) {
                        throw new Error(__('reset_password.no_reset_token', null, req.locale))
                    }

                    if (!compareSync(token, user[name].passwordResetToken)) {
                        throw new Error(__('reset_password.invalid_token', null, req.locale))
                    }

                    if (!user[name].passwordResetTokenExpiresAt) {
                        throw new Error(__('reset_password.no_expiry', null, req.locale))
                    }

                    if (new Date() >= user[name].passwordResetTokenExpiresAt) {
                        throw new Error(__('reset_password.expired_token', null, req.locale))
                    }                    

                    return updateUser(user._id, {
                        passwordResetToken: null,
                        password: hash(newPassword)
                    }).then(() => {
                        if (onResetPassword) {
                            onResetPassword({
                                _id: user._id,
                                email: user[name].email
                            })
                        }
                        return res.send({
                            message: __('reset_password.password_reset', null, req.locale),
                        })
                    })
                })
        })

        registerMethod('change-password', requireLogged, function(req, res) {
            const { password, newPassword } = req.body

            if (!typeof password === 'string') {
                throw new Error(__('change_password.invalid_password', null, req.locale))
            }

            testValue('password', newPassword, req.locale)

            return getUserById(req.user._id)
                .then(user => {
                    if ((password || (user[name] && user[name].password)) && !compareSync(password, user[name].password)) {
                        throw new Error(__('change_password.invalid_password', null, req.locale))
                    }

                    updateUser(user._id, {
                        passwordResetToken: null,
                        password: hash(newPassword)
                    }).then(() => {
                        if (onChangePassword) {
                            onChangePassword({
                                _id: user._id,
                                email: user[name] && user[name].email
                            })
                        }
                        return res.send({
                            message: __('change_password.password_changed', null, req.locale)
                        })
                    })
                })
        })

    }
}
