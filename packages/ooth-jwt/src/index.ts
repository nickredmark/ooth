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
  sharedSecret?: string;
  privateKey?: string;
  publicKey?: string;
  algorithm?: string;
  includeProfile?: boolean;
  tokenLocation: 'header' | 'body' | 'both';
};

type TokenOptions = {
  sharedSecret?: string;
  privateKey?: string;
  publicKey?: string;
  algorithm?: string;
  includeProfile?: boolean;
};

function randomToken(): string {
  return randomBytes(43).toString('hex');
}

export async function getToken(userId: string, iat: number, tokenExpiry: number, options: TokenOptions, ooth: Ooth): Promise<string> {
    const data: {[key: string]: any} = {
      iat,
      exp: iat + tokenExpiry,
      _id: userId,
    };

    if (options.includeProfile) {
      data.user = ooth.getProfile(await ooth.getUserById(userId));
    }

    if (options.sharedSecret) {
      return sign(data, options.sharedSecret);
    }

    if (options.privateKey) {
      return sign(data, options.privateKey, {
        algorithm: options.algorithm,
      });
    }
    throw new Error('No secret nor key provided');
  }

export default function({
  name = 'jwt',
  ooth,
  tokenExpiry = 60 * 60, // 1 hour
  refreshTokenExpiry = 60 * 60 * 24, // 1 day
  sharedSecret,
  privateKey,
  publicKey,
  algorithm = 'RS256',
  includeProfile = false,
  tokenLocation = 'both',
}: Options): void {

  if (sharedSecret === undefined && privateKey === undefined) {
    throw new Error('Either sharedSecret or privateKey/publicKey pair is required');
  }
  if (sharedSecret !== undefined && privateKey !== undefined) {
    throw new Error('Either sharedSecret or privateKey should be provided, not both');
  }
  if (privateKey !== undefined && publicKey === undefined) {
    throw new Error('publicKey is required with privateKey');
  }
  // Return jwt after successful (primary) auth
  ooth.registerAuthAfterware(async (result: { [key: string]: any }, userId: string | undefined) => {
    if (userId) {
      result.token = await getToken(userId, new Date().getTime() / 1000, tokenExpiry, {
        sharedSecret,
        privateKey,
        publicKey,
        algorithm,
        includeProfile,
      }, ooth);

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

  const readTokenFromHeader = (tokenLocation === 'header' || tokenLocation === 'both');
  const readTokenFromBody   = (tokenLocation === 'body'   || tokenLocation === 'both');

  // Authenticate user with jwt
  ooth.registerSecondaryAuth(
    name,
    'auth',
    (req: FullRequest) =>
      !req.user &&
      ((readTokenFromBody && req.body && req.body.token) ||
        (readTokenFromHeader && req.get('authorization') &&
          req
            .get('authorization')!
            .split(' ')
            .pop())),
    new JwtStrategy(
      {
        secretOrKey: sharedSecret || publicKey,
        jwtFromRequest: (req: Request) => {
          let token;
          if (readTokenFromBody && req.body && req.body.token) {
            token = req.body.token;
          }
          if (readTokenFromHeader) {
            const authorization = req.get('authorization');
            if (authorization) {
              token = authorization.split(' ').pop();
            }
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
