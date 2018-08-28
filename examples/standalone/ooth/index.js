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
const settings = require("config");
const { MongoClient } = require("mongodb");

async function start() {
  try {
    const app = express();
    app.use(morgan("dev"));
    const corsMiddleware = cors({
      origin: settings.originUrl,
      credentials: true,
      preflightContinue: false
    });
    app.use(corsMiddleware);
    app.options(corsMiddleware);

    const db = await MongoClient.connect(settings.mongoUrl);
    const oothMongo = new OothMongo(db);
    const ooth = new Ooth({
      app,
      backend: oothMongo,
      sessionSecret: settings.sessionSecret,
      standalone: true,
      sharedSecret: settings.sharedSecret
    });

    oothGuest({ ooth });
    oothLocal({ ooth });
    emailer({ ooth, ...settings.mail, sendMail: mail(settings.mailgun) });
    oothUser({ ooth });
    oothJwt({ ooth, sharedSecret: settings.sharedSecret });
    oothWs({ ooth });

    app.listen(settings.port, function() {
      console.info(`Ooth started on port ${settings.port}`);
    });
  } catch (e) {
    console.error(e);
  }
}

start();
