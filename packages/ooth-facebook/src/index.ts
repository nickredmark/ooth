import * as FacebookStrategy from 'passport-facebook-token';
import { Ooth, StrategyValues } from 'ooth';

type Config = {
  name?: string;
  ooth: Ooth;
  clientID: string;
  clientSecret: string;
};

type Profile = {
  id: string;
  emails: {
    value: string;
  }[];
};

export default function({ name = 'facebook', ooth, clientID, clientSecret }: Config): void {
  ooth.registerUniqueField(name, 'email', 'email');
  ooth.registerProfileFields(name, 'email');
  ooth.registerStrategyUniqueField(name, 'id');
  ooth.registerPrimaryConnect(
    name,
    'login',
    [],
    new FacebookStrategy(
      {
        clientID,
        clientSecret,
      },
      (_accessToken: string, _refreshToken: string, profile: Profile, done: (e: Error | null, u: StrategyValues) => void) =>
        done(null, {
          id: profile.id,
          email: profile.emails[0].value,
        }),
    ),
  );
}
