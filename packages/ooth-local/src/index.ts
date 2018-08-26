import { compareSync, genSaltSync, hashSync } from 'bcrypt-nodejs';
import { randomBytes } from 'crypto';
import { FullRequest, Ooth, StrategyValues, User } from 'ooth';
import { getI18n, Translations } from 'ooth-i18n';
import { Strategy as LocalStrategy, VerifyFunctionWithRequest } from 'passport-local';
import { callbackify } from 'util';

const SALT_ROUNDS = 12;
const HOUR = 1000 * 60 * 60;
const DEFAULT_LANGUAGE = 'en';
const DEFAULT_TRANSLATIONS = {
  en: require('../i18n/en.json'),
};

export type Validators = {
  [name: string]: {
    regex?: RegExp;
    test?: (value: string) => Boolean;
    error: string;
  };
};

const DEFAULT_VALIDATORS: Validators = {
  username: {
    regex: /^[a-z][0-9a-z_]{3,19}$/,
    error: 'validators.invalid_username',
  },
  password: {
    test: (password: string) =>
      /\d/.test(password) && /[a-z]/.test(password) && /[A-Z]/.test(password) && /.{6,}/.test(password),
    error: 'validators.invalid_password',
  },
  email: {
    regex: /^.+@.+$/,
    error: 'validators.invalid_email',
  },
};

function randomToken(): string {
  return randomBytes(43).toString('hex');
}

function hash(pass: string): string {
  return hashSync(pass, genSaltSync(SALT_ROUNDS));
}

type Result = {
  message: string;
};

export type Options = {
  name?: string;
  ooth: Ooth;
  onRegister?: (args: { _id: string; email: string; verificationToken: string }) => void;
  onGenerateVerificationToken?: (args: { _id: string; email: string; verificationToken: string }) => void;
  onSetEmail?: (args: { _id: string; email: string; verificationToken: string }) => void;
  onVerify?: (args: { _id: string; email: string }) => void;
  onForgotPassword?: (args: { _id: string; email: string; passwordResetToken: string }) => void;
  onResetPassword?: (args: { _id: string; email: string }) => void;
  onChangePassword?: (args: { _id: string; email: string }) => void;
  defaultLanguage?: string;
  translations?: Translations;
  validators?: Validators;
};

export default function({
  name = 'local',
  ooth,
  onRegister,
  onGenerateVerificationToken,
  onSetEmail,
  onVerify,
  onForgotPassword,
  onResetPassword,
  onChangePassword,
  defaultLanguage,
  translations,
  validators,
}: Options): void {
  const __ = getI18n(translations || DEFAULT_TRANSLATIONS, defaultLanguage || DEFAULT_LANGUAGE);
  const actualValidators: Validators = { ...DEFAULT_VALIDATORS, ...validators };

  function testValue(key: string, value: string, language: string): void {
    const test = actualValidators[key];
    if (test.regex) {
      if (!test.regex.test(value)) {
        throw new Error(__(test.error, null, language));
      }
    } else {
      if (!test.test!(value)) {
        throw new Error(__(test.error, null, language));
      }
    }
  }

  ooth.registerUniqueField(name, 'username', 'username');
  ooth.registerUniqueField(name, 'email', 'email');
  ooth.registerProfileFields(name, 'username', 'email', 'verified');

  ooth.registerPassportMethod(
    name,
    'login',
    [ooth.requireNotLogged],
    new LocalStrategy(
      {
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true,
      },
      callbackify(async (req: FullRequest, username: string, password: string) => {
        let user = await ooth.getUserByUniqueField('username', username);

        if (!user) {
          user = await ooth.getUserByUniqueField('email', username);
        }

        if (!user) {
          throw new Error(__('login.no_user', null, req.locale));
        }

        if (!user[name]) {
          throw new Error(__('login.no_password', null, req.locale));
        }

        if (!compareSync(password, (user[name]! as StrategyValues).password)) {
          throw new Error(__('login.invalid_password', null, req.locale));
        }

        return user;
      }) as VerifyFunctionWithRequest,
    ),
  );

  ooth.registerMethod(
    name,
    'set-username',
    [ooth.requireLogged],
    async ({ username }: any, user: User | null, locale: string): Promise<Result> => {
      if (typeof username !== 'string') {
        throw new Error(__('set_username.invalid_username', null, locale));
      }

      testValue('username', username, locale);

      const existingUser = await ooth.getUserByUniqueField('username', username);

      if (existingUser) {
        throw new Error(__('username_taken.invalid_username', null, locale));
      }

      await ooth.updateUser(name, user!._id, {
        username,
      });

      return {
        message: __('set_username.username_updated', null, locale),
      };
    },
  );

  ooth.registerMethod(
    name,
    'set-email',
    [ooth.requireLogged],
    async ({ email }: any, user: User | null, locale: string): Promise<Result> => {
      if (typeof email !== 'string') {
        throw new Error(__('set_email.invalid_email', null, locale));
      }

      testValue('email', email, locale);

      const existingUser = await ooth.getUserByUniqueField('email', email);
      if (existingUser && existingUser._id !== user!._id) {
        throw new Error(__('set_email.email_already_registered', null, locale));
      }

      const verificationToken = randomToken();

      await ooth.updateUser(name, user!._id, {
        email,
        verificationToken: hash(verificationToken),
        verificationTokenExpiresAt: new Date(Date.now() + HOUR),
      });

      if (onSetEmail) {
        onSetEmail({
          email,
          verificationToken,
          _id: user!._id,
        });
      }

      return {
        message: __('set_email.email_updated', null, locale),
      };
    },
  );

  ooth.registerMethod(
    name,
    'register',
    [ooth.requireNotLogged],
    async ({ email, password }: any, user: User | null, locale: string): Promise<Result> => {
      if (typeof email !== 'string') {
        throw new Error(__('register.invalid_email', null, locale));
      }
      if (typeof password !== 'string') {
        throw new Error(__('register.invalid_password', null, locale));
      }

      testValue('password', password, locale);

      let verificationToken;

      const existingUser = await ooth.getUserByUniqueField('email', email);

      if (existingUser) {
        throw new Error(__('register.email_already_registered', null, locale));
      }

      verificationToken = randomToken();

      const _id = await ooth.insertUser(name, {
        email,
        password: hash(password),
        verificationToken: hash(verificationToken),
        verificationTokenExpiresAt: new Date(Date.now() + HOUR),
      });

      if (onRegister) {
        onRegister({
          _id,
          email,
          verificationToken,
        });
      }

      return {
        message: __('register.registered', null, locale),
      };
    },
  );

  ooth.registerMethod(
    name,
    'generate-verification-token',
    [ooth.requireRegisteredWith(name)],
    async (_: any, user: User | null, locale: string): Promise<Result> => {
      const verificationToken = randomToken();

      if (!user![name] || !(user![name] as StrategyValues).email) {
        throw new Error(__('generate_verification_token.no_email', null, locale));
      }

      await ooth.updateUser(name, user!._id, {
        verificationToken: hash(verificationToken),
        verificationTokenExpiresAt: new Date(Date.now() + HOUR),
      });
      if (onGenerateVerificationToken) {
        onGenerateVerificationToken({
          verificationToken,
          _id: user!._id,
          email: (user![name] as StrategyValues).email,
        });
      }

      return {
        message: __('generate_verification_token.token_generated', null, locale),
      };
    },
  );

  ooth.registerMethod(
    name,
    'verify',
    [],
    async ({ userId, token }: any, _user: User | null, locale: string): Promise<Result> => {
      if (!userId) {
        throw new Error(__('verify.no_user_id', null, locale));
      }

      if (!token) {
        throw new Error(__('verify.token_generated', null, locale));
      }

      const user = await ooth.getUserById(userId);
      if (!user) {
        throw new Error(__('verify.no_user', null, locale));
      }

      const strategyValues: StrategyValues = user[name] as StrategyValues;

      if (!strategyValues || !strategyValues.email) {
        // No email to verify, but let's not leak this information
        throw new Error(__('verify.no_email', null, locale));
      }

      if (!compareSync(token, strategyValues.verificationToken)) {
        throw new Error(__('verify.invalid_token', null, locale));
      }

      if (!strategyValues.verificationTokenExpiresAt) {
        throw new Error(__('verify.no_expiry', null, locale));
      }

      if (new Date() >= strategyValues.verificationTokenExpiresAt) {
        throw new Error(__('verify.expired_token', null, locale));
      }

      await ooth.updateUser(name, user._id, {
        verified: true,
        verificationToken: null,
      });

      const newUser = await ooth.getUserById(user._id);

      if (onVerify) {
        onVerify({
          _id: newUser._id,
          email: (newUser[name] as StrategyValues).email,
        });
      }

      return {
        message: __('verify.verified', null, locale),
      };
    },
  );

  ooth.registerMethod(
    name,
    'forgot-password',
    [ooth.requireNotLogged],
    async ({ username }: any, _user: User | null, locale: string): Promise<Result> => {
      if (!username || typeof username !== 'string') {
        throw new Error(__('forgot_password.invalid_username', null, locale));
      }

      let user = await ooth.getUserByUniqueField('username', username);
      if (!user) {
        user = await ooth.getUserByUniqueField('email', username);
      }

      if (!user) {
        throw new Error(__('forgot_password.no_user', null, locale));
      }

      const email = ooth.getUniqueField(user, 'email');

      const passwordResetToken = randomToken();

      await ooth.updateUser(name, user._id, {
        email,
        passwordResetToken: hash(passwordResetToken),
        passwordResetTokenExpiresAt: new Date(Date.now() + HOUR),
      });

      if (onForgotPassword) {
        onForgotPassword({
          email,
          passwordResetToken,
          _id: user._id,
        });
      }

      return {
        message: __('forgot_password.token_generated', null, locale),
      };
    },
  );

  ooth.registerMethod(
    name,
    'reset-password',
    [ooth.requireNotLogged],
    async ({ userId, token, newPassword }: any, _user: User | null, locale: string): Promise<Result> => {
      if (!userId) {
        throw new Error(__('reset_password.no_user_id', null, locale));
      }

      if (!token) {
        throw new Error(__('reset_password.no_token', null, locale));
      }

      if (!newPassword || typeof newPassword !== 'string') {
        throw new Error(__('reset_password.invalid_password', null, locale));
      }

      testValue('password', newPassword, locale);

      const user = await ooth.getUserById(userId);

      if (!user) {
        throw new Error('User does not exist.');
      }

      const strategyValues = user[name] as StrategyValues;

      if (!strategyValues || !strategyValues.passwordResetToken) {
        throw new Error(__('reset_password.no_reset_token', null, locale));
      }

      if (!compareSync(token, strategyValues.passwordResetToken)) {
        throw new Error(__('reset_password.invalid_token', null, locale));
      }

      if (!strategyValues.passwordResetTokenExpiresAt) {
        throw new Error(__('reset_password.no_expiry', null, locale));
      }

      if (new Date() >= strategyValues.passwordResetTokenExpiresAt) {
        throw new Error(__('reset_password.expired_token', null, locale));
      }

      await ooth.updateUser(name, user._id, {
        passwordResetToken: null,
        password: hash(newPassword),
      });

      if (onResetPassword) {
        onResetPassword({
          _id: user._id,
          email: strategyValues.email,
        });
      }

      return {
        message: __('reset_password.password_reset', null, locale),
      };
    },
  );

  ooth.registerMethod(
    name,
    'change-password',
    [ooth.requireLogged],
    async ({ password, newPassword }: any, user: User | null, locale: string): Promise<Result> => {
      if (typeof password !== 'string') {
        throw new Error(__('change_password.invalid_password', null, locale));
      }

      testValue('password', newPassword, locale);

      const strategyValues = user![name] as StrategyValues;

      if ((password || (strategyValues && strategyValues.password)) && !compareSync(password, strategyValues.password)) {
        throw new Error(__('change_password.invalid_password', null, locale));
      }

      await ooth.updateUser(name, user!._id, {
        passwordResetToken: null,
        password: hash(newPassword),
      });
      if (onChangePassword) {
        onChangePassword({
          _id: user!._id,
          email: strategyValues && strategyValues.email,
        });
      }

      return {
        message: __('change_password.password_changed', null, locale),
      };
    },
  );
}
