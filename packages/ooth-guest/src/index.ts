import { Ooth, FullRequest, StrategyValues } from 'ooth';

const { Strategy } = require('passport-custom');

export default function({ ooth, name = 'guest' }: { ooth: Ooth; name?: string }): void {
  ooth.registerPrimaryConnect(
    name,
    'register',
    [ooth.requireNotLogged],
    new Strategy((_req: FullRequest, done: (e: Error | null, v: StrategyValues) => void) => done(null, {})),
  );
}
