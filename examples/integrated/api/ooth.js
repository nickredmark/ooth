const express = require('express')
const Ooth = require('ooth')
const oothGuest = require('ooth-guest')
const oothLocal = require('ooth-local')
const mail = require('./mail')
const {MongoClient, ObjectId} = require('mongodb')
const OothMongo = require('ooth-mongo')
const emailer = require('ooth-local-emailer')

module.exports = async function start(app, settings) {

    const ooth = new Ooth({
        sharedSecret: settings.sharedSecret,
        path: settings.oothPath,
    })
    const db = await MongoClient.connect(settings.mongoUrl)
    const oothMongo = new OothMongo(db, ObjectId)
    await ooth.start(app, oothMongo)

    ooth.use('guest', oothGuest())
    ooth.use('local', oothLocal(emailer({
        ...settings.mail,
        sendMail: mail(settings.mailgun)
    })));
}