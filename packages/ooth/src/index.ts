import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import { randomBytes } from 'crypto';
import { Application, Request, RequestHandler, Response, Router } from 'express';
import * as expressWs from 'express-ws';
import { sign } from 'jsonwebtoken';
import { getI18n, Translations, Values } from 'ooth-i18n';
import * as passport from 'passport';
import { Strategy as JwtStrategy } from 'passport-jwt';
import * as WebSocket from 'ws';
import { callbackify } from 'util';

const locale = require('locale');

export interface Backend {
  getUserById(id: string): Promise<User>;
  getUser(fields: { [key: string]: any }): Promise<User>;
  getUserByValue(fields: string[], value: any): Promise<User>;
  updateUser(id: string, fields: { [key: string]: any }): Promise<any>;
  insertUser(fields: { [key: string]: any }): Promise<any>;
}

export type Options = {
  app: Application;
  backend: Backend;
  sharedSecret: string;
  standalone?: boolean;
  path?: string;
  tokenExpires?: number;
  onLogin?: (user: User) => any;
  onRegister?: (user: User) => any;
  onLogout?: () => any;
  specJwt?: boolean;
  onRefreshRequest?: (args: { refreshToken: string }) => any;
  onRefreshRequestUser?: (
    args: {
      user: User;
      refreshToken: string;
    },
  ) => any;
  refreshTokenExpiry?: number;
  defaultLanguage?: string;
  translations?: Translations;
};

export type StrategyValues = {
  [field: string]: any;
};

export type User = {
  _id: string;
  refreshTokenExpiresAt?: Date;
  [strategyName: string]: undefined | string | Date | StrategyValues;
};

type Strategy = {
  profileFields: {
    [key: string]: true;
  };
  methods: string[];
  uniqueFields: {
    [key: string]: true;
  };
};

type Strategies = {
  [key: string]: Strategy;
};

type RouterWithWs = Router & {
  ws: any;
};

export type FullRequest = Request & {
  session: {
    id: string;
  };
  locale: string;
};

type MyRequestHandler = (req: FullRequest, res: Response, next: () => any) => any;

type FinalRequestHandler = (req: FullRequest, res: Response) => any;

type Token = {
  iat: number;
  exp?: number;
  _id?: string;
};

const DEFAULT_LANGUAGE = 'en';
const DEFAULT_TRANSLATIONS = {
  en: require('../i18n/en.json'),
};

function randomToken(): string {
  return randomBytes(43).toString('hex');
}

function post(route: Router, routeName: string, ...handlers: (MyRequestHandler | FinalRequestHandler)[]): void {
  const middleware = handlers.slice(0, -1) as RequestHandler[];
  const handler = handlers[handlers.length - 1] as FinalRequestHandler;
  route.post(routeName, ...middleware, async (req: Request, res: Response) => {
    try {
      const data = await handler(req as FullRequest, res);

      return res.send(data);
    } catch (e) {
      console.error(e);
      return res.status(400).send({
        status: 'error',
        message: e.message || e,
      });
    }
  });
}

function authenticate(methodName: string, req: Request, res: Response): Promise<any> {
  return new Promise((resolve, reject) => {
    const auth = passport.authenticate(methodName, (err: Error, user: any, info: any) => {
      if (err) {
        reject(err);
      }

      if (!user) {
        reject(new Error((info && info.message) || 'Unknown error.'));
      }

      resolve(user);
    });
    auth(req, res);
  });
}

function login(req: Request, user: any): Promise<void> {
  return new Promise((resolve, reject) => {
    return req.login(user, (err) => {
      if (err) {
        reject(err);
      }

      resolve();
    });
  });
}

export class Ooth {
  private sharedSecret: string;
  private standalone: boolean;
  private path: string;
  private tokenExpires: number | false;
  private onLogin?: (user: User) => any;
  private onRegister?: (user: User) => any;
  private onLogout?: (user: User) => any;
  private specJwt?: boolean;
  private onRefreshRequest?: (args: { refreshToken: string }) => any;
  private onRefreshRequestUser?: (
    args: {
      user: User;
      refreshToken: string;
    },
  ) => any;
  private refreshTokenExpiry: number;
  private uniqueFields: { [key: string]: { [key: string]: string } } = {};
  private strategies: Strategies = {};
  private connections: { [key: string]: WebSocket[] } = {};
  private route: RouterWithWs = Router();
  private translations: Translations;
  private defaultLanguage: string;
  private __: (s: string, values: Values | null, language: string) => string;
  private backend: Backend;
  private app: Application;

  constructor({
    app,
    backend,
    sharedSecret,
    standalone = false,
    path,
    tokenExpires, // TODO NEXT MAJOR: true
    onLogin,
    onRegister,
    onLogout,
    specJwt, // TODO NEXT MAJOR: true
    onRefreshRequest,
    onRefreshRequestUser,
    refreshTokenExpiry = 60 * 60 * 24, // seconds, 1 day
    defaultLanguage,
    translations,
  }: Options) {
    if (!app) {
      throw new Error('App is required.');
    }
    this.app = app;

    if (!backend) {
      throw new Error('Backend is required.');
    }
    this.backend = backend;
    this.sharedSecret = sharedSecret;
    this.standalone = standalone;
    this.path = path || '/';
    this.tokenExpires = tokenExpires || false;
    this.onLogin = onLogin;
    this.onRegister = onRegister;
    this.onLogout = onLogout;
    this.specJwt = specJwt;
    this.onRefreshRequest = onRefreshRequest;
    this.onRefreshRequestUser = onRefreshRequestUser;
    this.refreshTokenExpiry = refreshTokenExpiry;
    this.translations = translations || DEFAULT_TRANSLATIONS;
    this.defaultLanguage = defaultLanguage || DEFAULT_LANGUAGE;
    this.__ = getI18n(this.translations, this.defaultLanguage);

    // App-wide configuration
    this.app.use(cookieParser());
    this.app.use(bodyParser.json());
    this.app.use(passport.initialize());
    this.app.use(passport.session());
    this.app.use(locale(Object.keys(this.translations), this.defaultLanguage));
    expressWs(this.app);

    this.app.use(this.path, this.route);

    passport.serializeUser((user: User, done) => {
      done(null, user._id);
    });
    passport.deserializeUser((id, done) => {
      if (typeof id === 'string') {
        this.backend!.getUserById(id)
          .then((user) => {
            done(null, user);
          })
          .catch(done);
      } else {
        done(null, false);
      }
    });

    this.route.get('/status', (req, res) => {
      if (req.user) {
        const user: User = this.getProfile(req.user)!;
        if (this.standalone) {
          res.send({
            user,
            token: this.getToken(req.user),
          });
        } else {
          res.send({
            user,
          });
        }
      } else {
        res.send({
          user: null,
        });
      }
    });
    post(this.route, '/logout', this.requireLogged, async (req: FullRequest, _res: Response) => {
      const user = req.user;
      this.sendStatus(req, {});
      req.logout();
      if (this.onLogout) {
        this.onLogout(user);
      }
      return {
        message: 'Logged out',
      };
    });

    if (this.standalone) {
      const passportJwtStrategy = new JwtStrategy(
        {
          secretOrKey: this.sharedSecret,
          jwtFromRequest: (req) => {
            let token;
            if (req.body && req.body.token) {
              token = req.body.token;
            }
            const authorization = req.get('authorization');
            if (authorization) {
              token = authorization.split(' ').pop();
            }

            if (!token) {
              throw new Error('No token found.');
            }

            return token;
          },
        },
        callbackify(async (payload: any) => {
          if (!payload._id && (!payload.user || !payload.user._id || typeof payload.user._id !== 'string')) {
            throw new Error('Malformed token payload.');
          }
          return payload._id ? payload : payload.user;
        }),
      );

      // Login with JWT token
      this.registerPassportMethod('root', 'login', this.requireNotLogged, passportJwtStrategy);

      // Refresh tokens
      passport.use('refresh', passportJwtStrategy);
      this.route.get('/refresh', async (req, res) => {
        const tokenPayload = await authenticate('refresh', req, res);

        if (!tokenPayload || !tokenPayload._id) {
          throw new Error('No user for refresh');
        }

        return this.backend!.getUserById(tokenPayload._id).then((user) => {
          if (!user) {
            throw new Error('No user for refresh.');
          }

          const refreshToken = randomToken();
          const now = new Date();
          const refreshTokenExpiresAt = new Date(now.valueOf() + this.refreshTokenExpiry * 1000);
          return this.backend!.updateUser(user._id, {
            refreshToken,
            refreshTokenExpiresAt,
          })
            .then(() => {
              return this.backend!.getUserById(user._id);
            })
            .then((_user) => {
              return res.send({
                refreshToken,
                refreshTokenExpiresAt,
              });
            });
        });
      });
      this.route.post('/refresh', async (req, res) => {
        if (!req.body.refreshToken) {
          throw new Error('Must supply refreshToken.');
        }

        if (this.onRefreshRequest) {
          this.onRefreshRequest({
            refreshToken: req.body.refreshToken,
          });
        }

        try {
          const user = await this.backend!.getUserByValue(['refreshToken'], req.body.refreshToken).then((user) => {
            if (!user) {
              throw new Error('No user found for that refreshToken.');
            }

            if (!user || !user.refreshTokenExpiresAt) {
              throw new Error('Bad refreshToken.');
            }

            const nowDate = new Date();
            const tokenExpiryDate = new Date(user.refreshTokenExpiresAt);

            if (nowDate.getTime() > tokenExpiryDate.getTime()) {
              throw new Error('Refresh token expired.');
            }
            return user;
          });
          if (this.onRefreshRequestUser) {
            this.onRefreshRequestUser({
              user,
              refreshToken: req.body.refreshToken,
            });
          }

          return res.send({
            token: this.getToken(user),
          });
        } catch (e) {
          console.error(e);
          return res.status(400).send({
            status: 'error',
            message: e.message || e,
          });
        }
      });
    }

    this.route.ws('/status', (ws: WebSocket, req: FullRequest) => {
      if (!this.connections[req.session.id]) {
        this.connections[req.session.id] = [];
      }
      this.connections[req.session.id].push(ws);

      if (req.user) {
        ws.send(
          JSON.stringify({
            user: this.getProfile(req.user),
          }),
        );
      } else {
        ws.send(
          JSON.stringify({
            user: null,
          }),
        );
      }

      ws.on('close', () => {
        this.connections[req.session.id] = this.connections[req.session.id].filter((wss) => ws !== wss);
      });
    });
  }

  public registerMethod(strategyName: string, method: string, ...handlers: any[]): void {
    this.getStrategy(strategyName).methods.push(method);

    // Split handlers into [...middleware, handler]
    const middleware = handlers.slice(0, -1);
    const handler = handlers[handlers.length - 1];

    const finalHandler = (req: Request, res: Response) => {
      try {
        const result = handler(req, res);
        if (result && result.catch) {
          result.catch((e: Error) => {
            return res.status(400).send({
              status: 'error',
              message: e.message,
            });
          });
        }
      } catch (e) {
        console.error(e);
        return res.status(400).send({
          status: 'error',
          message: e.message,
        });
      }
    };

    this.route.post(`/${strategyName}/${method}`, ...middleware, finalHandler);
  }

  public registerGetMethod(strategyName: string, method: string, ...handlers: any[]): void {
    this.getStrategy(strategyName).methods.push(method);
    this.route.get(`/${strategyName}/${method}`, ...handlers);
  }

  public registerUniqueField(strategyName: string, id: string, fieldName: string): void {
    if (!this.uniqueFields[id]) {
      this.uniqueFields[id] = {};
    }
    this.uniqueFields[id][strategyName] = fieldName;
  }

  public registerStrategyUniqueField(strategyName: string, ...fieldNames: string[]): void {
    for (const fieldName of fieldNames) {
      this.getStrategy(strategyName).uniqueFields[fieldName] = true;
    }
  }

  public registerProfileFields(strategyName: string, ...fieldNames: string[]): void {
    for (const fieldName of fieldNames) {
      this.getStrategy(strategyName).profileFields[fieldName] = true;
    }
  }

  public getUniqueField = (user: User, fieldName: string) => {
    if (this.uniqueFields[fieldName]) {
      for (const strategyName of Object.keys(this.uniqueFields[fieldName])) {
        const actualFieldName = this.uniqueFields[fieldName][strategyName];
        if (user[strategyName] && (user[strategyName] as StrategyValues)[actualFieldName]) {
          return (user[strategyName] as StrategyValues)[actualFieldName];
        }
      }
    }
    return null;
  };

  public getUserByFields = async (strategyName: string, fields: { [key: string]: any }) => {
    const actualFields: { [key: string]: any } = {};
    Object.keys(fields).forEach((field) => {
      actualFields[`${strategyName}.${field}`] = fields[field];
    });
    return await this.backend!.getUser(actualFields);
  };

  public requireLogged = (req: FullRequest, res: Response, next: () => any) => {
    if (!req.user) {
      return res.status(400).send({
        status: 'error',
        message: this.__('not_logged', null, req.locale),
      });
    }
    next();
  };

  public requireNotLogged = (req: FullRequest, res: Response, next: () => any) => {
    if (req.user) {
      return res.status(400).send({
        status: 'error',
        message: this.__('already_logged', null, req.locale),
      });
    }
    next();
  };

  public requireNotRegistered = (req: FullRequest, res: Response, next: () => any) => {
    if (req.user) {
      return res.status(400).send({
        status: 'error',
        message: this.__('already_registered', null, req.locale),
      });
    }
    next();
  };

  public requireRegisteredWith = (strategy: string) => {
    return (req: FullRequest, res: Response, next: () => any) => {
      return this.requireLogged(req, res, () => {
        const user = req.user;
        if (!user[strategy]) {
          return res.status(400).send({
            status: 'error',
            message: this.__('not_registered_with', { strategy }, req.locale),
          });
        }
        req.user[strategy] = user[strategy];
        next();
      });
    };
  };

  public registerPassportMethod(strategyName: string, method: string, ...handlers: any[]): void {
    this.getStrategy(strategyName).methods.push(method);

    // Split handlers into [...middleware, handler]
    const middleware = handlers.slice(0, -1);
    const handler = handlers[handlers.length - 1];

    const methodName = strategyName !== 'root' ? `${strategyName}-${method}` : method;
    const routeName = strategyName !== 'root' ? `/${strategyName}/${method}` : `/${method}`;

    passport.use(methodName, handler);
    post(this.route, routeName, ...middleware, async (req: FullRequest, res: Response) => {
      const user: User = await authenticate(methodName, req, res);

      await login(req, user);

      const profile = this.getProfile(user)!;

      this.sendStatus(req, {
        user: profile,
      });

      if (this.onLogin) {
        this.onLogin(profile);
      }

      if (this.standalone) {
        return {
          user: profile,
          token: this.getToken(profile),
        };
      }

      return {
        user: profile,
      };
    });
  }

  public registerPassportConnectMethod(
    strategy: string,
    method: string,
    ...handlers: (MyRequestHandler | passport.Strategy)[]
  ): void {
    this.strategies[strategy].methods.push(method);

    // Split handlers into [...middleware, handler]
    const middleware = handlers.slice(0, -1) as MyRequestHandler[];
    const handler = handlers[handlers.length - 1] as passport.Strategy;

    const methodName = strategy !== 'root' ? `${strategy}-${method}` : method;
    const routeName = strategy !== 'root' ? `/${strategy}/${method}` : `/${method}`;

    passport.use(methodName, handler);
    post(this.route, routeName, ...middleware, async (req: FullRequest, res: Response) => {
      const userPart: StrategyValues = await authenticate(methodName, req, res);

      if (!userPart) {
        throw new Error('Strategy should return an object.');
      }

      let user: User | null = null;
      for (const field of Object.keys(this.strategies[strategy].uniqueFields)) {
        const value = userPart[field];
        if (value) {
          const userCandidate = await this.backend!.getUser({
            [`${strategy}.${field}`]: value,
          });
          if (!user || user._id === userCandidate._id) {
            user = userCandidate;
          } else {
            throw new Error(this.__('register.ambiguous_authentication_strategy', null, req.locale));
          }
        }
      }
      for (const field of Object.keys(this.uniqueFields)) {
        if (this.uniqueFields[field][strategy]) {
          const value = userPart[this.uniqueFields[field][strategy]];
          if (value) {
            const userCandidate = await this.getUserByUniqueField(field, value);
            if (!user || user._id === userCandidate._id) {
              user = userCandidate;
            } else {
              throw new Error(this.__('register.ambiguous_authentication_strategy', null, req.locale));
            }
          }
        }
      }

      let registered = false;
      if (req.user) {
        // User is already logged in

        if (user && user._id !== req.user._id) {
          throw new Error(this.__('register.foreign_authentication_strategy', null, req.locale));
        }

        // Update user
        await this.updateUser(strategy, req.user._id, userPart);
        user = await this.backend!.getUserById(req.user._id);
      } else {
        // User hasn't logged in

        if (user) {
          // User exists already, update
          await this.updateUser(strategy, user._id, userPart);
          user = await this.backend!.getUserById(user._id);
        } else {
          // Need to create a new user
          const _id = await this.insertUser(strategy, userPart);
          user = await this.backend!.getUserById(_id);
          registered = true;
        }
      }

      let loggedIn = false;
      if (!req.user) {
        await login(req, user);
        loggedIn = true;
      }

      const profile = this.getProfile(user)!;

      this.sendStatus(req, {
        user: profile,
      });

      if (loggedIn && this.onLogin) {
        this.onLogin(profile);
      }
      if (registered && this.onRegister) {
        this.onRegister(profile);
      }

      if (this.standalone) {
        return {
          user: profile,
          token: this.getToken(profile),
        };
      }

      return {
        user: profile,
      };
    });
  }

  public getUserById = async (id: string) => {
    return this.backend.getUserById(id);
  };

  public getUserByUniqueField = async (fieldName: string, value: any) => {
    return await this.backend!.getUserByValue(
      Object.keys(this.uniqueFields[fieldName]).map(
        (strategyName) => `${strategyName}.${this.uniqueFields[fieldName][strategyName]}`,
      ),
      value,
    );
  };

  public updateUser = async (strategyName: string, id: string, fields: StrategyValues) => {
    const actualFields: { [key: string]: string } = {};
    Object.keys(fields).forEach((field) => {
      actualFields[`${strategyName}.${field}`] = fields[field];
    });
    return await this.backend!.updateUser(id, actualFields);
  };

  public getProfile(user: User | null): User | null {
    if (!user) {
      return null;
    }
    const profile: User = {
      _id: user._id,
    };
    for (const strategyName of Object.keys(this.strategies)) {
      if (!user[strategyName]) {
        continue;
      }

      for (const fieldName of Object.keys(this.getStrategy(strategyName).profileFields)) {
        if (!profile[strategyName]) {
          profile[strategyName] = {};
        }
        (profile[strategyName] as StrategyValues)[fieldName] = (user[strategyName] as StrategyValues)[fieldName];
      }
    }
    return profile;
  }

  public insertUser = async (strategyName: string, fields: StrategyValues) => {
    const query: { [key: string]: { [key: string]: any } } = {};
    if (fields) {
      query[strategyName] = fields;
    }
    return await this.backend!.insertUser(query);
  };

  private getToken(user: User): string {
    let token: Token = {
      iat: new Date().getTime() / 1000, // Unix timestamp
    };

    if (this.tokenExpires && this.tokenExpires > 0) {
      token.exp = token.iat + this.tokenExpires;
    }

    if (this.specJwt) {
      token._id = user._id;
    } else {
      // Deprecated token
      token = {
        ...token,
        ...user,
      } as any;
    }
    return sign(token, this.sharedSecret);
  }

  private getStrategy(strategyName: string): Strategy {
    if (!this.strategies[strategyName]) {
      this.strategies[strategyName] = {
        methods: [],
        profileFields: {},
        uniqueFields: {},
      };
    }

    return this.strategies[strategyName];
  }

  private sendStatus(req: FullRequest, status: any): void {
    if (req.session && this.connections[req.session.id]) {
      this.connections[req.session.id].forEach((ws) => {
        ws.send(JSON.stringify(status));
      });
    }
  }
}
