require('dotenv').config();
const express = require('express');
const { Ooth } = require('ooth');
const { OothMongo } = require('ooth-mongo');
const { OothPrisma } = require('./ooth-prisma');
const oothGuest = require('ooth-guest').default;
const oothLocal = require('ooth-local').default;
const oothUser = require('ooth-user').default;
const oothWs = require('ooth-ws').default;
const emailer = require('ooth-local-emailer').default;
const oothJwt = require('ooth-jwt').default;
const morgan = require('morgan');
const cors = require('cors');
const mail = require('./mail');
const { MongoClient } = require('mongodb');
const { Prisma } = require('./prisma-client');

// prismadcker ps

async function start() {
  try {
    const app = express();
    app.use(morgan('dev'));
    const corsMiddleware = cors({
      origin: process.env.ORIGIN_URL,
      credentials: true,
      preflightContinue: false
    });
    app.use(corsMiddleware);
    app.options(corsMiddleware);

    const prisma = new Prisma();
    const oothPrisma = new OothPrisma(prisma);

    // const userByEmail = await prisma.user({
    //   email: 'hi2@there.com'
    // });

    // console.log({ userByEmail });

    const db = await MongoClient.connect(process.env.MONGO_URL);
    const oothMongo = new OothMongo(db);

    // let devUsers = await oothMongo.users;
    // // let devGetUserById = await oothMongo.getUserById('1234');
    // let devGetUserByUniqueField = await oothMongo.getUser({
    //   'email': 'davey@web-shed.com'
    // });

    const id = await oothMongo.insertUser({
      foo: {
        baz: 'bar'
      }
    });

    const user = await oothMongo.getUserById(id);
    console.log({ id, user });

    const id2 = await oothMongo.insertUser({});
    await oothMongo.updateUser(id2, {
      foo2: 'bar2'
    });
    const user2 = await oothMongo.getUserById(id2);

    console.log({ id2, user2 });

    await oothMongo.insertUser({
      foo: {
        bar: 'baz'
      },
      foo2: {
        bar2: 'baz2'
      }
    });
    const user3 = await oothMongo.getUserByValue(
      ['foo.bar', 'foo2.bar2'],
      'baz2'
    );

    console.log({ user3 });

    await oothMongo.insertUser({
      foo: {
        bar: 'baz'
      },
      foo2: {
        bar2: 'baz2'
      }
    });
    const user4 = await oothMongo.getUser({
      'foo.bar': 'baz',
      'foo2.bar2': 'baz2'
    });

    console.log({ user4 });

    const ooth = new Ooth({
      app,
      backend: oothMongo,
      sessionSecret: process.env.SESSION_SECRET,
      standalone: true
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
          domain: process.env.MAILGUN_DOMAIN
        })
      });
    }
    oothUser({ ooth });
    oothJwt({
      ooth,
      sharedSecret: process.env.SHARED_SECRET,
      tokenLocation: 'header'
    });
    oothWs({ ooth });

    app.listen(process.env.PORT, function() {
      console.info(`Ooth started on port ${process.env.PORT}`);
    });
  } catch (e) {
    console.error(e);
  }
}

start();
