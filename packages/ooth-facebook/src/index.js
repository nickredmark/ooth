const FacebookStrategy = require('passport-facebook-token')
const nodeify = require('nodeify')

function nodeifyAsync(asyncFunction) {
    return function(...args) {
        return nodeify(asyncFunction(...args.slice(0, -1)), args[args.length - 1])
    }
}

module.exports = function({
    clientID,
    clientSecret,
}) {
    return function({
        name,
        registerUniqueField,
        registerProfileField,
        registerPassportMethod,
        requireNotLogged,
        getUserById,
        getUserByUniqueField,
        getUserByFields,
        insertUser,
        updateUser,
    }) {
        registerUniqueField('email', 'email')
        registerProfileField('email')
        registerPassportMethod('login', requireNotLogged, new FacebookStrategy({
            clientID,
            clientSecret,
        }, nodeifyAsync((accessToken, refreshToken, profile, done) => {
            const id = profile.id
            const email = profile.emails[0].value
            return getUserByFields({id})
                .then(user => {
                    if (user) {
                        return user
                    }

                    return getUserByUniqueField('email', email)
                        .then(user => {
                            if (user) {
                                if (!user[name]) {
                                    return updateUser(user._id, {
                                        id,
                                        email,
                                    }).then(() => user)
                                }

                                return user
                            }
    
                            return insertUser({
                                id,
                                email,
                            }).then(_id => {
                                return getUserById(_id)
                            })
                        })
                })
        })))
    }
}
