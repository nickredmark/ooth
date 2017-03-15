const next = require('next')
const express = require('express')
const settings = require('./settings')
const api = require('./api').start

const start = async () => {
    const app = express()

    api(app, settings)

    const nextApp = next({
        dev: true
    })
    const handle = nextApp.getRequestHandler()

    await nextApp.prepare()

    app.get('*', (req, res) => {
        return handle(req, res)
    })

    await app.listen(settings.port)

    console.log(`Online at ${settings.url}:${settings.port}`)
}

start()