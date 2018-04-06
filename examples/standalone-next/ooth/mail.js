const mailcomposer = require('mailcomposer')
const Mg = require('mailgun-js')

module.exports = function(options) {
    const Mailgun = Mg(options)
    return function({from, to, subject, body, html}) {
        return new Promise((resolve, reject) => {
            const mail = mailcomposer({
                from,
                to,
                subject,
                body,
                html
            })
            mail.build((e, message) => {
                if (e) {
                    return reject(e)
                }
                Mailgun.messages().sendMime({
                    to,
                    message: message.toString('ascii')
                }, (e, r) => {
                    if (e) {
                        return reject(e)
                    }
                    resolve(e)
                })
            })
        })
    }
}