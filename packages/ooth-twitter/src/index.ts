import { FullRequest, Ooth, StrategyValues } from 'ooth';

const request = require('request');
const qs = require('qs');

const { Strategy } = require('passport-custom');

type Config = {
  name?: string;
  ooth: Ooth;
  clientID: string;
  clientSecret: string;
  callbackUrl: string;
};

export default function({ name = 'twitter', ooth, clientID, clientSecret, callbackUrl }: Config): void {
  ooth.registerUniqueField(name, 'email', 'email');
  ooth.registerProfileFields(name, 'email');
  ooth.registerStrategyUniqueField(name, 'id');

  ooth.registerMethod(
    name,
    'reverse',
    [],
    async () =>
      new Promise((res, rej) =>
        request.post(
          {
            url: 'https://api.twitter.com/oauth/request_token',
            oauth: {
              callback: callbackUrl,
              consumer_key: clientID,
              consumer_secret: clientSecret,
            },
            headers: {
              Accept: 'application/json',
            },
          },
          (err: Error, _: any, body: string) => {
            if (err) {
              return rej(err);
            }

            if (body.indexOf('errors') > -1) {
              try {
                return rej(new Error(JSON.parse(body).errors[0].message));
              } catch (e) {
                return rej(new Error(`Unexpected error: ${e.message}`));
              }
            }

            res(qs.parse(body));
          },
        ),
      ),
  );

  ooth.registerPrimaryConnect(
    name,
    'login',
    [],
    new Strategy(async (req: FullRequest, done: (e: Error | null, v: StrategyValues) => void) => {
      const { oauth_token, oauth_verifier } = req.body;
      request.post(
        {
          url: 'https://api.twitter.com/oauth/access_token',
          oauth: {
            consumer_key: clientID,
            consumer_secret: clientSecret,
            token: oauth_token,
          },
          form: {
            oauth_verifier,
          },
        },
        (err: Error, _: any, body: string) => {
          if (err) {
            return done(err, {});
          }

          if (body.indexOf('errors') > -1) {
            try {
              return done(new Error(JSON.parse(body).errors[0].message), {});
            } catch (e) {
              return done(new Error(`Unexpected error: ${e.message}`), {});
            }
          }

          const { oauth_token, oauth_token_secret, user_id, screen_name } = qs.parse(body);

          request.get(
            {
              url: 'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true',
              oauth: {
                consumer_key: clientID,
                consumer_secret: clientSecret,
                token: oauth_token,
                token_secret: oauth_token_secret,
              },
            },
            (err: Error, _: any, body: string) => {
              if (err) {
                return done(err, {});
              }

              const data = JSON.parse(body);

              if (data.errors) {
                return done(new Error(data.errors[0].message), {});
              }

              done(null, {
                token: oauth_token,
                tokenSecret: oauth_token_secret,
                id: user_id,
                username: screen_name,
                email: data.email,
              });
            },
          );
        },
      );
    }),
  );
}
