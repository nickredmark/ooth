const { Ooth } = require("ooth");
const oothGuest = require("ooth-guest").default;
const oothLocal = require("ooth-local").default;
const oothUser = require("ooth-user").default;
const oothWs = require("ooth-ws").default;
const mail = require("./mail");
const { MongoClient, ObjectId } = require("mongodb");
const { OothMongo } = require("ooth-mongo");
const emailer = require("ooth-local-emailer").default;

module.exports = async function start(app, settings) {
  const db = await MongoClient.connect(settings.mongoUrl);
  const oothMongo = new OothMongo(db, ObjectId);
  const ooth = new Ooth({
    app,
    backend: oothMongo,
    sessionSecret: settings.sessionSecret,
    path: settings.oothPath
  });

  oothGuest({ ooth });
  oothLocal({ ooth });
  oothUser({ ooth });
  oothWs({ ooth });
  emailer({ ooth, ...settings.mail, sendMail: mail(settings.mailgun) });
};
