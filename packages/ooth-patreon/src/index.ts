import formUrlencoded from 'form-urlencoded';
import nodeFetch from 'node-fetch';
import { FullRequest, Ooth } from 'ooth';
import { callbackify } from 'util';

const qs = require('qs');
const { Strategy } = require('passport-custom');
type Config = {
  name?: string;
  ooth: Ooth;
  clientID: string;
  clientSecret: string;
  redirectURL: string;
};

export default function({ name = 'patreon', ooth, clientID, clientSecret, redirectURL }: Config): void {
  ooth.registerUniqueField(name, 'email', 'email');
  ooth.registerProfileFields(name, 'id', 'email', 'member');
  ooth.registerStrategyUniqueField(name, 'id');
  ooth.registerPrimaryConnect(
    name,
    'login',
    [],
    new Strategy(
      callbackify(async (req: FullRequest) => {
        const code = req.body.code;

        const tokenRes = await nodeFetch(`https://www.patreon.com/api/oauth2/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formUrlencoded({
            code,
            grant_type: 'authorization_code',
            client_id: clientID,
            client_secret: clientSecret,
            redirect_uri: redirectURL,
          }),
        });
        const tokenData = await tokenRes.json();

        const accessToken = tokenData.access_token;
        const refreshToken = tokenData.refresh_token;
        const userRes = await nodeFetch(
          `https://www.patreon.com/api/oauth2/v2/identity?${qs.stringify({
            include: 'memberships',
            fields: {
              user: 'email',
            },
          })}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
        const user = await userRes.json();

        const member = user.data.relationships.memberships.data.length > 0;

        return {
          accessToken,
          refreshToken,
          member,
          email: user.data.attributes.email,
          id: user.data.id,
        };
      }),
    ),
  );
}
