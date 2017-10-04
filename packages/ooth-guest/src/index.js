const nodeify = require('nodeify')
const CustomStrategy = require('passport-custom').Strategy

module.exports = function() {
    return function({
        registerPassportConnectMethod,
    }) {
        registerPassportConnectMethod('register', new CustomStrategy((req, done) => {
            return done(null, {})
        }))
    } 
}
