import { compare, hash } from 'bcrypt';
import { randomBytes } from 'crypto';
import { Request } from 'express';
import { sign } from 'jsonwebtoken';
import { FullRequest, Ooth, StrategyValues } from 'ooth';
import { Strategy as JwtStrategy } from 'passport-jwt';
import { callbackify } from 'util';

const { Strategy } = require('passport-custom');

const SALT_ROUNDS = 12;

type Options = {
  name?: string;
  ooth: Ooth;
  tokenExpiry?: number;
  refreshTokenExpiry?: number;
  sharedSecret: string;
};

function randomToken(): string {
  return randomBytes(43).toString('hex');
}

export function getToken(userId: string, iat: number, tokenExpiry: number, sharedSecret: string): string {
  return sign(
    {
      iat,
      exp: iat + tokenExpiry,
      _id: userId,
    },
    sharedSecret,
  );
}

export default function({
  name = 'jwt',
  ooth,
  tokenExpiry = 60 * 60, // 1 hour
  refreshTokenExpiry = 60 * 60 * 24, // 1 day
  sharedSecret,
}: Options): void {
  // Return jwt after successful (primary) auth
  ooth.registerAuthAfterware(async (result: { [key: string]: any }, userId: string | undefined) => {
    if (userId) {
      result.token = getToken(userId, new Date().getTime() / 1000, tokenExpiry, sharedSecret);

      const refreshToken = randomToken();
      const now = new Date();
      const refreshTokenExpiresAt = new Date(now.valueOf() + refreshTokenExpiry * 1000);

      ooth.updateUser(name, userId, {
        refreshTokenExpiresAt,
        refreshToken: await hash(refreshToken, SALT_ROUNDS),
      });

      result.refreshToken = refreshToken;
      result.refreshTokenExpiresAt = refreshTokenExpiresAt;
    }

    return result;
  });

  // Authenticate user with jwt
  ooth.registerSecondaryAuth(
    name,
    'auth',
    (req: FullRequest) =>
      !req.user &&
      ((req.body && req.body.token) ||
        (req.get('authorization') &&
          req
            .get('authorization')!
            .split(' ')
            .pop())),
    new JwtStrategy(
      {
        secretOrKey: sharedSecret,
        jwtFromRequest: (req: Request) => {
          let token;
          if (req.body && req.body.token) {
            token = req.body.token;
          }
          const authorization = req.get('authorization');
          if (authorization) {
            token = authorization.split(' ').pop();
          }

          return token;
        },
      },
      callbackify(async (payload: any) => {
        if (!payload || !payload._id || typeof payload._id !== 'string') {
          throw new Error('Malformed token payload.');
        }

        return payload._id;
      }),
    ),
  );

  /*
  // Get refresh token
  ooth.registerMethod(name, 'get-refresh-token', [ooth.requireLogged], async (_: any, userId: string | undefined) => {
    const refreshToken = randomToken();
    const now = new Date();
    const refreshTokenExpiresAt = new Date(now.valueOf() + refreshTokenExpiry * 1000);

    ooth.updateUser(name, userId!, {
      refreshTokenExpiresAt,
      refreshToken: await hash(refreshToken, SALT_ROUNDS),
    });

    return {
      refreshToken,
      refreshTokenExpiresAt,
    };
  });
  */

  // Use refresh token to authenticate again
  ooth.registerPrimaryAuth(
    name,
    'refresh',
    [],
    new Strategy(
      callbackify(async (req: FullRequest) => {
        const { userId, refreshToken } = req.body;

        if (!userId) {
          throw new Error('Must supply user id.');
        }

        if (!refreshToken) {
          throw new Error('Must supply refreshToken.');
        }

        await ooth.emit(name, 'refresh-request', {
          refreshToken,
        });

        const user = await ooth.getUserById(userId);
        if (!user) {
          throw new Error('No user found.');
        }

        const strategyValues: StrategyValues = user[name] as StrategyValues;

        if (!strategyValues) {
          throw new Error("User didn't log in with jwt");
        }

        if (!(await compare(refreshToken, strategyValues.refreshToken))) {
          throw new Error('Bad refreshToken.');
        }

        if (!strategyValues.refreshTokenExpiresAt) {
          throw new Error('Bad refreshToken.');
        }

        const now = new Date();
        const tokenExpiresAt = new Date(strategyValues.refreshTokenExpiresAt);

        if (now.getTime() > tokenExpiresAt.getTime()) {
          throw new Error('Refresh token expired.');
        }

        await ooth.emit(name, 'refresh-user', {
          user,
          refreshToken,
        });

        return userId;
      }),
    ),
  );
}
