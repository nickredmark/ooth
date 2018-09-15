const { Ooth } = require("ooth");
const oothGuest = require("ooth-guest").default;
const oothLocal = require("ooth-local").default;
const oothUser = require("ooth-user").default;
const oothWs = require("ooth-ws").default;
const mail = require("./mail");
const { MongoClient, ObjectId } = require("mongodb");
const { OothMongo } = require("ooth-mongo");
const emailer = require("ooth-local-emailer").default;

module.exports = async function start(app) {
  const db = await MongoClient.connect(process.env.MONGO_URL);
  const oothMongo = new OothMongo(db, ObjectId);
  const ooth = new Ooth({
    app,
    backend: oothMongo,
    sessionSecret: process.env.SESSION_SECRET,
    path: process.env.OOTH_PATH,
  });

  oothGuest({ ooth });
  oothLocal({ ooth });
  oothUser({ ooth });
  oothWs({ ooth });
  if (process.env.MAIL_FROM) {
    emailer({
      ooth,
      from: process.env.MAIL_FROM,
      siteName: process.env.MAIL_SITE_NAME,
      url: process.env.MAIL_URL,
      sendMail: mail({
        apiKey: process.env.MAILGUN_API_KEY,
        domain: process.env.MAILGUN_DOMAIN,
      })
    })
  } 
};
