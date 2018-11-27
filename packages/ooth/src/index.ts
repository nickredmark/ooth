import * as bodyParser from 'body-parser';
import { Application, Request, RequestHandler, Response, Router } from 'express';
import { getI18n, Translations, Values } from 'ooth-i18n';
import * as passport from 'passport';
import * as expressSession from 'express-session';
import * as cookieParser from 'cookie-parser';

const { Strategy } = require('passport-custom');
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
  path?: string;
  sessionSecret?: string;
  session?: RequestHandler;

  defaultLanguage?: string;
  translations?: Translations;
};

export type StrategyValues = {
  [field: string]: any;
};

export type User = {
  _id: string;
  [strategyName: string]: undefined | string | Date | StrategyValues;
};

type Condition = (req: FullRequest) => boolean;

type Method<T> = (params: any, user: string | undefined, locale: string) => Promise<T>;

type Strategy = {
  profileFields: {
    [key: string]: true;
  };
  methods: {
    [key: string]: Method<any>;
  };
  uniqueFields: {
    [key: string]: true;
  };
  secondaryAuth: {
    [key: string]: Condition;
  };
};

type Strategies = {
  [key: string]: Strategy;
};

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

type Override<T, K> = Omit<T, keyof K> & K;

export type FullRequest = Override<
  Request,
  {
    locale: string;
    user?: string | undefined;
    session?: {
      id: string;
      cookie: {
        maxAge?: number;
      };
    };
  }
>;

type MyRequestHandler = (req: FullRequest, res: Response, next: () => any) => any;

type UserIdResolver<T> = (req: FullRequest, authResult: T) => Promise<string | undefined>;

type Result = { [key: string]: any };

type Afterware = ((res: Result, userId: string | undefined, req: FullRequest, response: Response) => Promise<Result>);

const DEFAULT_LANGUAGE = 'en';
const DEFAULT_TRANSLATIONS = {
  en: require('../i18n/en.json'),
};

const authenticate = <T>(methodName: string, session: boolean, req: FullRequest, res: Response): Promise<T> =>
  new Promise((resolve, reject) =>
    passport.authenticate(
      methodName,
      {
        session,
      },
      (err: Error, user: any, info: any) =>
        err ? reject(err) : !user && info && info.message ? reject(info.message) : resolve(user),
    )(req, res),
  );

type EventListener = (payload: any) => Promise<void>;

export class Ooth {
  private path: string;
  private uniqueFields: { [key: string]: { [key: string]: string } } = {};
  private strategies: Strategies = {};
  private route: Router = Router();
  private translations: Translations;
  private defaultLanguage: string;
  private __: (s: string, values: Values | null, language: string) => string;
  private backend: Backend;
  private app: Application;
  private middleware: RequestHandler[] = [];
  private afterware: Afterware[] = [];
  private authAfterware: Afterware[] = [];
  private session?: RequestHandler;
  private listeners: { [name: string]: EventListener[] } = {};

  constructor({ app, backend, path, defaultLanguage, translations, session, sessionSecret }: Options) {
    if (!app) {
      throw new Error('App is required.');
    }
    this.app = app;

    if (!backend) {
      throw new Error('Backend is required.');
    }
    this.backend = backend;
    this.path = path || '/';
    this.translations = translations || DEFAULT_TRANSLATIONS;
    this.defaultLanguage = defaultLanguage || DEFAULT_LANGUAGE;
    this.__ = getI18n(this.translations, this.defaultLanguage);
    if (sessionSecret && session) {
      throw new Error('Either set session or sessionSecret, not both');
    }
    if (session) {
      this.session = session;
    }
    if (sessionSecret) {
      this.session = expressSession({
        secret: sessionSecret,
        name: 'ooth-session-id',
        resave: false,
        saveUninitialized: true,
      });
    }
    if (this.session) {
      this.registerAuthAfterware(async (result: Result, _userId: string | undefined, req: FullRequest) => {
        if (req.body.remember) {
          req.session!.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
        }
        return result;
      });
    }

    // App-wide configuration
    this.app.use(bodyParser.json());
    this.app.use(locale(Object.keys(this.translations), this.defaultLanguage));
    if (this.session) {
      this.app.use(cookieParser());
      this.app.use(this.session);
    }
    this.app.use(passport.initialize());
    if (this.session) {
      this.app.use(passport.session());
      passport.serializeUser((id: string | undefined, done: (e: Error | null, id: string | undefined) => void) =>
        done(null, id),
      );
      passport.deserializeUser((id: string | undefined, done: (e: Error | null, id: string | undefined) => void) =>
        done(null, id),
      );
      this.registerPrimaryAuth(
        'session',
        'logout',
        [this.requireLogged],
        new Strategy((_req: FullRequest, done: (e: Error | null, v: null | User | StrategyValues) => void) =>
          done(null, null),
        ),
      );
    }
    this.app.use(async (req, res, next) => {
      try {
        const fullRequest: FullRequest = req as any;
        for (const strategyName of Object.keys(this.strategies)) {
          for (const methodName of Object.keys(this.strategies[strategyName].secondaryAuth)) {
            if (this.strategies[strategyName].secondaryAuth[methodName](fullRequest)) {
              const userId = await authenticate<string | undefined>(
                `${strategyName}-${methodName}`,
                !!this.session,
                fullRequest,
                res,
              );
              await new Promise((res, rej) =>
                fullRequest.login(userId, { session: !!this.session }, (e) => (e ? rej(e) : res())),
              );
            }
          }
        }
        next();
      } catch (e) {
        console.error(e);
        return res.status(400).send({
          status: 'error',
          message: typeof e === 'string' ? e : e.message,
        });
      }
    });
    this.app.use(this.path, this.route);
  }

  public usesSession(): boolean {
    return !!this.session;
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
    return (req: FullRequest, res: Response, next: () => any) =>
      this.requireLogged(req, res, async () => {
        const user = await this.getUserById(req.user!);
        if (!user[strategy]) {
          return res.status(400).send({
            status: 'error',
            message: this.__('not_registered_with', { strategy }, req.locale),
          });
        }
        next();
      });
  };

  public registerPrimaryAuth<T>(
    strategyName: string,
    method: string,
    middleware: MyRequestHandler[],
    strategy: passport.Strategy,
    resolveUserId: UserIdResolver<T> = async (_req: FullRequest, userId: T) => userId as any,
  ): void {
    const methodName = `${strategyName}-${method}`;
    const routeName = `/${strategyName}/${method}`;
    passport.use(methodName, strategy);
    this.route.post(routeName, ...((middleware as any) as RequestHandler[]), async (req: Request, res: Response) => {
      const fullRequest: FullRequest = req as any;
      try {
        const authResult = await authenticate<T>(methodName, !!this.session, fullRequest, res);
        const userId = await resolveUserId(fullRequest, authResult);
        if (req.user !== userId) {
          if (userId) {
            this.emit('ooth', 'login', { userId, sessionId: req.session && req.session.id });
            await new Promise((res, rej) =>
              fullRequest.login(userId, { session: !!this.session }, (e) => (e ? rej(e) : res())),
            );
          } else {
            this.emit('ooth', 'logout', { userId: req.user, sessionId: req.session && req.session.id });
            req.logout();
          }
        }

        let result = {};
        for (const aw of [...this.authAfterware, ...this.afterware]) {
          result = await aw(result, fullRequest.user, fullRequest, res);
        }
        return res.send(result);
      } catch (e) {
        console.error(e);
        return res.status(400).send({
          status: 'error',
          message: e.message || e,
        });
      }
    });
  }

  public registerPrimaryConnect(
    strategyName: string,
    method: string,
    middleware: MyRequestHandler[],
    strategy: passport.Strategy,
  ): void {
    this.registerPrimaryAuth<StrategyValues | null>(
      strategyName,
      method,
      middleware,
      strategy,
      async (req: FullRequest, userPart: StrategyValues | null) => {
        if (!userPart) {
          return;
        }

        let userId: string | undefined;
        for (const field of Object.keys(this.getStrategy(strategyName).uniqueFields)) {
          const value = userPart[field];
          if (value) {
            const userCandidate = await this.backend!.getUser({
              [`${strategyName}.${field}`]: value,
            });
            if (userCandidate) {
              if (!userId || userId === userCandidate._id) {
                userId = userCandidate._id;
              } else {
                throw new Error(this.__('register.ambiguous_authentication_strategy', null, req.locale));
              }
            }
          }
        }
        for (const field of Object.keys(this.uniqueFields)) {
          if (this.uniqueFields[field][strategyName]) {
            const value = userPart[this.uniqueFields[field][strategyName]];
            if (value) {
              const userCandidate = await this.getUserByUniqueField(field, value);
              if (userCandidate) {
                if (!userId || userId === userCandidate._id) {
                  userId = userCandidate._id;
                } else {
                  throw new Error(this.__('register.ambiguous_authentication_strategy', null, req.locale));
                }
              }
            }
          }
        }

        let registered = false;
        if (req.user) {
          // User is already logged in

          if (userId && userId !== req.user) {
            throw new Error(this.__('register.foreign_authentication_strategy', null, req.locale));
          }

          userId = req.user;

          // Update user
          await this.updateUser(strategyName, userId, userPart);
        } else {
          // User hasn't logged in

          if (userId) {
            // User exists already, update
            await this.updateUser(strategyName, userId, userPart);
          } else {
            // Need to create a new user
            userId = await this.insertUser(strategyName, userPart);
            registered = true;
          }
        }

        if (registered) {
          this.emit('ooth', 'register', { userId });
        }

        return userId;
      },
    );
  }

  public registerSecondaryAuth(
    strategyName: string,
    method: string,
    condition: Condition,
    strategy: passport.Strategy,
  ): void {
    const methodName = `${strategyName}-${method}`;
    if (this.getStrategy(strategyName).secondaryAuth[method]) {
      throw new Error(`Secondary auth ${methodName} has already been registered.`);
    }
    passport.use(methodName, strategy);
    this.getStrategy(strategyName).secondaryAuth[method] = condition;
  }

  public registerMethod<T>(
    strategyName: string,
    method: string,
    middleware: MyRequestHandler[],
    handler: Method<T>,
    httpMethod: 'POST' | 'GET' = 'POST',
  ): void {
    this.getStrategy(strategyName).methods[method] = handler;

    const finalHandler = async (req: FullRequest, res: Response) => {
      try {
        let result = await this.callMethod(strategyName, method, req.body, req.user, req.locale);
        for (const aw of this.afterware) {
          result = await aw(result, req.user, req, res);
        }
        res.send(result);
      } catch (e) {
        console.error(e);
        return res.status(400).send({
          status: 'error',
          message: e.message,
        });
      }
    };

    this.route[httpMethod === 'GET' ? 'get' : 'post'](
      `/${strategyName}/${method}`,
      ...((middleware as any) as RequestHandler[]),
      (finalHandler as any) as RequestHandler,
    );
  }

  public async callMethod<T>(strategyName: string, method: string, params: any, user: any, locale: string): Promise<T> {
    return await this.getStrategy(strategyName).methods[method](params, user, locale);
  }

  public registerMiddleware(...middleware: RequestHandler[]): void {
    this.middleware.push(...middleware);
  }

  public registerAfterware(...afterware: Afterware[]): void {
    this.afterware.push(...afterware);
  }

  public registerAuthAfterware(...afterware: Afterware[]): void {
    this.authAfterware.push(...afterware);
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

  public getProfile(user: User | undefined): User | undefined {
    if (!user) {
      return;
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

  public getApp(): Application {
    return this.app;
  }

  public getRoute(): Router {
    return this.route;
  }

  public on(strategyName: string, eventName: string, eventListener: EventListener): void {
    const fullEventName = `${strategyName}--${eventName}`;
    if (!this.listeners[fullEventName]) {
      this.listeners[fullEventName] = [];
    }

    this.listeners[fullEventName].push(eventListener);
  }

  public async emit(strategyName: string, eventName: string, payload: any): Promise<void> {
    const fullEventName = `${strategyName}--${eventName}`;
    if (this.listeners[fullEventName]) {
      for (const listener of this.listeners[fullEventName]) {
        await listener(payload);
      }
    }
  }

  private getStrategy(strategyName: string): Strategy {
    if (!this.strategies[strategyName]) {
      this.strategies[strategyName] = {
        methods: {},
        profileFields: {},
        uniqueFields: {},
        secondaryAuth: {},
      };
    }

    return this.strategies[strategyName];
  }
}
