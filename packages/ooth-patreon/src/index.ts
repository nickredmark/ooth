import { Ooth, StrategyValues, FullRequest } from 'ooth';
const { patreon, oauth } = require('patreon');

const { Strategy } = require('passport-custom');

type Config = {
  name?: string;
  ooth: Ooth;
  clientID: string;
  clientSecret: string;
  creatorID: string;
  redirectURL: string;
};

export default function({ name = 'patreon', ooth, clientID, clientSecret, redirectURL, creatorID }: Config): void {
  const patreonOAuthClient = oauth(clientID, clientSecret);

  ooth.registerUniqueField(name, 'email', 'email');
  ooth.registerProfileFields(name, 'id', 'rewards', 'email');
  ooth.registerStrategyUniqueField(name, 'id');
  ooth.registerPrimaryConnect(
    name,
    'login',
    [],
    new Strategy(async (req: FullRequest, done: (e: Error | null, v: StrategyValues) => void) => {
      try {
        const code = req.body.code;

        const tokensRespose = await patreonOAuthClient.getTokens(code, redirectURL);
        const accessToken = tokensRespose.access_token;
        const patreonAPIClient = patreon(accessToken);

        const userRespnse = await patreonAPIClient('/current_user');
        const user = userRespnse.rawJson;

        const rewards = user.included
          .filter((o: any) => o.type === 'pledge' && o.relationships.creator.data.id === creatorID)
          .map((pledge: any) => pledge.relationships.reward.data.id);

        done(null, {
          accessToken,
          rewards,
          refreshToken: tokensRespose.refresh_token,
          email: user.data.attributes.email,
          id: user.data.id,
        });
      } catch (e) {
        done(e, null as any);
      }
    }),
  );
}
