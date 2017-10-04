const GoogleStrategy = require('passport-google-id-token')

module.exports = function({
    clientID,
    clientSecret,
}) {
    return function({
        name,
        registerUniqueField,
        registerProfileField,
        registerPassportConnectMethod,
    }) {
        registerUniqueField('email', 'email')
        registerProfileField('email')
        registerPassportConnectMethod('login', new GoogleStrategy({
            clientID,
            clientSecret,
        }, (parsedToken, googleId, done) => {
            return done(null, {
                email: parsedToken.payload.email
            })
        }))
    }
}
