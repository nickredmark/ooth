import { compareSync, genSaltSync, hashSync } from 'bcrypt-nodejs';
import { randomBytes } from 'crypto';
import { FullRequest, Ooth, StrategyValues } from 'ooth';
import { getI18n, Translations } from 'ooth-i18n';
import { Strategy as LocalStrategy, VerifyFunctionWithRequest } from 'passport-local';
import { callbackify } from 'util';
import { Response } from 'express';

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

export type Options = {
  name: string;
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
    ooth.requireNotLogged,
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
    ooth.requireLogged,
    async (req: FullRequest, res: Response): Promise<void> => {
      const { username } = req.body;

      if (typeof username !== 'string') {
        throw new Error(__('set_username.invalid_username', null, req.locale));
      }

      testValue('username', username, req.locale);

      const existingUser = await ooth.getUserByUniqueField('username', username);

      if (existingUser) {
        throw new Error(__('username_taken.invalid_username', null, req.locale));
      }

      await ooth.updateUser(name, req.user._id, {
        username,
      });

      const user = await ooth.getUserById(req.user._id);

      res.send({
        message: __('set_username.username_updated', null, req.locale),
        user: ooth.getProfile(user),
      });
    },
  );

  ooth.registerMethod(
    name,
    'set-email',
    ooth.requireLogged,
    async (req: FullRequest, res: Response): Promise<void> => {
      const { email } = req.body;

      if (typeof email !== 'string') {
        throw new Error(__('set_email.invalid_email', null, req.locale));
      }

      testValue('email', email, req.locale);

      const existingUser = await ooth.getUserByUniqueField('email', email);
      if (existingUser && existingUser._id !== req.user._id) {
        throw new Error(__('set_email.email_already_registered', null, req.locale));
      }

      const verificationToken = randomToken();

      await ooth.updateUser(name, req.user._id, {
        email,
        verificationToken: hash(verificationToken),
        verificationTokenExpiresAt: new Date(Date.now() + HOUR),
      });

      if (onSetEmail) {
        onSetEmail({
          email,
          verificationToken,
          _id: req.user._id,
        });
      }

      const user = await ooth.getUserById(req.user._id);

      res.send({
        message: __('set_email.email_updated', null, req.locale),
        user: ooth.getProfile(user),
      });
    },
  );

  ooth.registerMethod(
    name,
    'register',
    ooth.requireNotLogged,
    async (req: FullRequest, res: Response): Promise<void> => {
      const { email, password } = req.body;

      if (typeof email !== 'string') {
        throw new Error(__('register.invalid_email', null, req.locale));
      }
      if (typeof password !== 'string') {
        throw new Error(__('register.invalid_password', null, req.locale));
      }

      testValue('password', password, req.locale);

      let verificationToken;

      const existingUser = await ooth.getUserByUniqueField('email', email);

      if (existingUser) {
        throw new Error(__('register.email_already_registered', null, req.locale));
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

      res.send({
        message: __('register.registered', null, req.locale),
      });
    },
  );

  ooth.registerMethod(
    name,
    'generate-verification-token',
    ooth.requireRegisteredWith(name),
    async (req: FullRequest, res: Response): Promise<void> => {
      const verificationToken = randomToken();

      const user = req.user;

      if (!user[name] || !user[name].email) {
        throw new Error(__('generate_verification_token.no_email', null, req.locale));
      }

      await ooth.updateUser(name, req.user._id, {
        verificationToken: hash(verificationToken),
        verificationTokenExpiresAt: new Date(Date.now() + HOUR),
      });
      if (onGenerateVerificationToken) {
        onGenerateVerificationToken({
          verificationToken,
          _id: user._id,
          email: user[name].email,
        });
      }

      res.send({
        message: __('generate_verification_token.token_generated', null, req.locale),
      });
    },
  );

  ooth.registerMethod(
    name,
    'verify',
    async (req: FullRequest, res: Response): Promise<void> => {
      const { userId, token } = req.body;

      if (!userId) {
        throw new Error(__('verify.no_user_id', null, req.locale));
      }

      if (!token) {
        throw new Error(__('verify.token_generated', null, req.locale));
      }

      const user = await ooth.getUserById(userId);
      if (!user) {
        throw new Error(__('verify.no_user', null, req.locale));
      }

      const strategyValues: StrategyValues = user[name] as StrategyValues;

      if (!strategyValues || !strategyValues.email) {
        // No email to verify, but let's not leak this information
        throw new Error(__('verify.no_email', null, req.locale));
      }

      if (!compareSync(token, strategyValues.verificationToken)) {
        throw new Error(__('verify.invalid_token', null, req.locale));
      }

      if (!strategyValues.verificationTokenExpiresAt) {
        throw new Error(__('verify.no_expiry', null, req.locale));
      }

      if (new Date() >= strategyValues.verificationTokenExpiresAt) {
        throw new Error(__('verify.expired_token', null, req.locale));
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

      res.send({
        message: __('verify.verified', null, req.locale),
        user: ooth.getProfile(newUser),
      });
    },
  );

  ooth.registerMethod(
    name,
    'forgot-password',
    ooth.requireNotLogged,
    async (req: FullRequest, res: Response): Promise<void> => {
      const { username } = req.body;

      if (!username || typeof username !== 'string') {
        throw new Error(__('forgot_password.invalid_username', null, req.locale));
      }

      let user = await ooth.getUserByUniqueField('username', username);
      if (!user) {
        user = await ooth.getUserByUniqueField('email', username);
      }

      if (!user) {
        throw new Error(__('forgot_password.no_user', null, req.locale));
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

      res.send({
        message: __('forgot_password.token_generated', null, req.locale),
      });
    },
  );

  ooth.registerMethod(
    name,
    'reset-password',
    ooth.requireNotLogged,
    async (req: FullRequest, res: Response): Promise<void> => {
      const { userId, token, newPassword } = req.body;

      if (!userId) {
        throw new Error(__('reset_password.no_user_id', null, req.locale));
      }

      if (!token) {
        throw new Error(__('reset_password.no_token', null, req.locale));
      }

      if (!newPassword || typeof newPassword !== 'string') {
        throw new Error(__('reset_password.invalid_password', null, req.locale));
      }

      testValue('password', newPassword, req.locale);

      const user = await ooth.getUserById(userId);

      if (!user) {
        throw new Error('User does not exist.');
      }

      const strategyValues = user[name] as StrategyValues;

      if (!strategyValues || !strategyValues.passwordResetToken) {
        throw new Error(__('reset_password.no_reset_token', null, req.locale));
      }

      if (!compareSync(token, strategyValues.passwordResetToken)) {
        throw new Error(__('reset_password.invalid_token', null, req.locale));
      }

      if (!strategyValues.passwordResetTokenExpiresAt) {
        throw new Error(__('reset_password.no_expiry', null, req.locale));
      }

      if (new Date() >= strategyValues.passwordResetTokenExpiresAt) {
        throw new Error(__('reset_password.expired_token', null, req.locale));
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
      res.send({
        message: __('reset_password.password_reset', null, req.locale),
      });
    },
  );

  ooth.registerMethod(
    name,
    'change-password',
    ooth.requireLogged,
    async (req: FullRequest, res: Response): Promise<void> => {
      const { password, newPassword } = req.body;

      if (typeof password !== 'string') {
        throw new Error(__('change_password.invalid_password', null, req.locale));
      }

      testValue('password', newPassword, req.locale);

      const user = await ooth.getUserById(req.user._id);

      const strategyValues = user[name] as StrategyValues;

      if ((password || (strategyValues && strategyValues.password)) && !compareSync(password, strategyValues.password)) {
        throw new Error(__('change_password.invalid_password', null, req.locale));
      }

      await ooth.updateUser(name, user._id, {
        passwordResetToken: null,
        password: hash(newPassword),
      });
      if (onChangePassword) {
        onChangePassword({
          _id: user._id,
          email: strategyValues && strategyValues.email,
        });
      }
      res.send({
        message: __('change_password.password_changed', null, req.locale),
      });
    },
  );
}
