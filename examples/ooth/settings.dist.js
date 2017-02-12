module.exports = {
    port: 3001,
    mongoUrl: 'mongodb://localhost:27017/ooth',
    mailgun: {
        apiKey: "XXX",
        domain: "XXX"
    },
    mail: {
        from: "info@example.com"
    },
    sharedSecret: 'XXX', // Has to be the same in api server
}