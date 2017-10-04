const FacebookStrategy = require('passport-facebook-token')

module.exports = function({
    clientID,
    clientSecret,
}) {
    return function({
        name,
        registerUniqueField,
        registerProfileField,
        registerStrategyUniqueField,
        registerPassportConnectMethod,
    }) {
        registerUniqueField('email', 'email')
        registerProfileField('email')
        registerStrategyUniqueField('id')
        registerPassportConnectMethod('login', new FacebookStrategy({
            clientID,
            clientSecret,
        }, (accessToken, refreshToken, profile, done) => {
            return done(null, {
                id: profile.id,
                email: profile.emails[0].value,
            })
        }))
    }
}
