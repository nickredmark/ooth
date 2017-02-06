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
    onRegister
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
        requireRegistered
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

        registerPassportMethod('register', requireNotRegistered, new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password'
        }, function(email, password, done) {
            return nodeify((async function() {
                if (typeof email !== 'string') {
                    throw new Error('Invalid email')
                }
                if (typeof password !== 'string') {
                    throw new Error(null, false, {
                        message: 'Invalid password'
                    })
                }

                let user = await getUserByUniqueField('email', email)

                if (user) {
                    if (user.local) {
                        if (user.local.email === email) {
                            throw new Error('This email is already registered')
                        } else {
                            throw new Error('This email is already registered')
                        }
                    } else {
                        await updateUser(user._id, {
                            email,
                            password: hashSync(password, SALT_ROUNDS)
                        })
                        return {
                            _id: user._id
                        }
                    }
                }

                const verificationToken = randomToken()

                const _id = insertUser({
                    email,
                    password: hashSync(password, SALT_ROUNDS),
                    verificationToken
                })
                
                onRegister({
                    _id,
                    email,
                    verificationToken
                })
                return {
                    _id
                }
            })(), done)
        }))

        registerMethod('verify', function(req, res) {
            (async () => {
                if (!req.body.token) {
                    return res.send({
                        message: 'Verification token required'
                    })
                }

                const user = await getUsersByFields({
                    verificationToken: req.body.token
                })

                if (!user) {
                    return res.send({
                        message: 'Verification token invalid'
                    })
                }

                await updateUser({
                    verified: true
                })

                return res.send({
                    message: 'Email verified'
                })
            })()
        })
    }
}