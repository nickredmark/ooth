const nodeify = require('nodeify')
const CustomStrategy = require('passport-custom').Strategy

function nodeifyAsync(asyncFunction) {
    return function(...args) {
        return nodeify(asyncFunction(...args.slice(0, -1)), args[args.length-1])
    }
}

module.exports = function() {
    return function({
        registerPassportMethod,
        requireNotLogged,
        insertUser
    }) {
        registerPassportMethod('register', requireNotLogged, new CustomStrategy(nodeifyAsync(async (req) => {
            const _id = await insertUser()
            return {
                _id
            }
        })))
    } 
}
