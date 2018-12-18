require('dotenv').config();
const express = require("express");
const { Ooth } = require("ooth");
const { OothMongo } = require("ooth-mongo");
const oothGuest = require("ooth-guest").default;
const oothLocal = require("ooth-local").default;
const oothUser = require("ooth-user").default;
const oothWs = require("ooth-ws").default;
const emailer = require("ooth-local-emailer").default;
const oothJwt = require("ooth-jwt").default;
const morgan = require("morgan");
const cors = require("cors");
const mail = require("./mail");
const { MongoClient } = require("mongodb");

async function start() {
  try {
    const app = express();
    app.use(morgan("dev"));
    const corsMiddleware = cors({
      origin: process.env.ORIGIN_URL,
      credentials: true,
      preflightContinue: false
    });
    app.use(corsMiddleware);
    app.options(corsMiddleware);

    const db = await MongoClient.connect(process.env.MONGO_URL);
    const oothMongo = new OothMongo(db);
    const ooth = new Ooth({
      app,
      backend: oothMongo,
      sessionSecret: process.env.SESSION_SECRET,
      standalone: true,
    });

    oothGuest({ ooth });
    oothLocal({ ooth });
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
    oothUser({ ooth });
    oothJwt({ ooth, sharedSecret: process.env.SHARED_SECRET, tokenLocation: 'header' });
    oothWs({ ooth });

    app.listen(process.env.PORT, function() {
      console.info(`Ooth started on port ${process.env.PORT}`);
    });
  } catch (e) {
    console.error(e);
  }
}

start();
