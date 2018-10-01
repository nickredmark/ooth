const { MongoClient } = require("mongodb");
const express = require("express");
const session = require("express-session");
const { Ooth } = require("ooth");
const oothLocal = require("ooth-local").default;
const oothUser = require("ooth-user").default;
const { OothMongo } = require("ooth-mongo");

const MONGO_HOST = "mongodb://localhost:27017";
const MONGO_DB = "ooth-minimal";
const HOST = "localhost";
const PORT = 3000;
const SECRET = "somesecret";
const OOTH_PATH = "/auth";

const start = async () => {
  try {
    const client = await MongoClient.connect(MONGO_HOST);
    const db = client.db(MONGO_DB);
    const app = express();
    const oothMongo = new OothMongo(db);
    const ooth = new Ooth({
      app,
      backend: oothMongo,
      sessionSecret: SECRET,
      path: OOTH_PATH
    });

    oothLocal({
      ooth
    });
    oothUser({
      ooth
    });

    ooth.on("local", "register", ({ email, verificationToken, _id }) => {
      console.log(`Someone registered.`);
    });
    ooth.on(
      "local",
      "generate-verification-token",
      ({ email, verificationToken }) => {
        console.log(`Someone requested a verification email.`);
      }
    );
    ooth.on("local", "verify", ({ email }) => {
      console.log(`Someone verified their email`);
    });
    ooth.on("local", "forgot-password", ({ email, passwordResetToken }) => {
      console.log(`Someone forgot their password`);
    });
    ooth.on("local", "reset-password", ({ email }) => {
      console.log(`Someone reset their password`);
    });

    app.get("/", (req, res) => res.sendFile(`${__dirname}/index.html`));

    await new Promise((res, rej) =>
      app.listen(PORT, HOST, e => (e ? rej(e) : res()))
    );
    console.info(`Online at ${HOST}:${PORT}`);
  } catch (e) {
    console.error(e);
  }
};

start();
