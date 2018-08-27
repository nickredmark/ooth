import { Ooth, StrategyValues } from 'ooth';

// tslint:disable-next-line variable-name
const GoogleStrategy = require('passport-google-id-token');

type Config = {
  name?: string;
  ooth: Ooth;
  clientID: string;
  clientSecret: string;
};

export default function({ name = 'google', ooth, clientID, clientSecret }: Config): void {
  ooth.registerUniqueField(name, 'email', 'email');
  ooth.registerProfileFields(name, 'email');
  ooth.registerPrimaryConnect(
    name,
    'login',
    [],
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
      },
      (parsedToken: { payload: { email: string } }, _googleId: string, done: (e: Error | null, u: StrategyValues) => void) =>
        done(null, {
          email: parsedToken.payload.email,
        }),
    ),
  );
}
