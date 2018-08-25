import { getI18n, interpolate, Translations, Values } from 'ooth-i18n';

type Urls = {
  [name: string]: string;
};

const DEFAULT_LANGUAGE = 'en';

const DEFAULT_URLS: Urls = {
  verifyEmail: '/verify-email?token={verification-token}&userId={user-id}',
  resetPassword: '/reset-password?token={password-reset-token}&userId={user-id}',
};
const DEFAULT_TRANSLATIONS = {
  en: require('../i18n/en.json'),
};

type Options = {
  from: string;
  siteName: string;
  sendMail: (args: { from: string; to: string; subject: string; body: string; html: string }) => Promise<void>;
  translations: Translations;
  urls: Urls;
  defaultLanguage: string;
};

export default function({
  from,
  siteName,
  sendMail,
  translations,
  urls,
  defaultLanguage,
}: Options): {
  onRegister: (
    args: {
      email: string;
      verificationToken: string;
      _id: string;
      language: string;
    },
  ) => Promise<void>;
  onGenerateVerificationToken: (
    args: {
      email: string;
      verificationToken: string;
      _id: string;
      language: string;
    },
  ) => Promise<void>;
  onSetEmail: (
    args: {
      email: string;
      verificationToken: string;
      _id: string;
      language: string;
    },
  ) => Promise<void>;
  onVerify: (args: { email: string; language: string }) => Promise<void>;
  onForgotPassword: (
    args: {
      email: string;
      passwordResetToken: string;
      _id: string;
      language: string;
    },
  ) => Promise<void>;
  onResetPassword: (args: { email: string; language: string }) => Promise<void>;
  onChangePassword: (args: { email: string; language: string }) => Promise<void>;
} {
  const actualUrls = urls || DEFAULT_URLS;

  const actualTranslations = translations || DEFAULT_TRANSLATIONS;

  const __ = getI18n(actualTranslations, defaultLanguage || DEFAULT_LANGUAGE);

  const sendI18nMail = (email: string, language: string, name: string, values: Values) =>
    sendMail({
      from,
      to: email,
      subject: __(`${name}.subject`, values, language),
      body: __(`${name}.body`, values, language),
      html: __(`${name}.html`, values, language),
    });

  return {
    async onRegister({
      email,
      verificationToken,
      _id,
      language,
    }: {
      email: string;
      verificationToken: string;
      _id: string;
      language: string;
    }): Promise<void> {
      await sendI18nMail(email, language, 'welcome', {
        'site-name': siteName,
      });
      await sendI18nMail(email, language, 'verify-email', {
        'site-name': siteName,
        'verify-email-url': interpolate(actualUrls.verifyEmail, {
          'verification-token': verificationToken,
          'user-id': _id,
        }),
      });
    },
    async onGenerateVerificationToken({
      email,
      verificationToken,
      _id,
      language,
    }: {
      email: string;
      verificationToken: string;
      _id: string;
      language: string;
    }): Promise<void> {
      await sendI18nMail(email, language, 'verify-email', {
        'site-name': siteName,
        'verify-email-url': interpolate(actualUrls.verifyEmail, {
          'verification-token': verificationToken,
          'user-id': _id,
        }),
      });
    },
    async onSetEmail({
      email,
      verificationToken,
      _id,
      language,
    }: {
      email: string;
      verificationToken: string;
      _id: string;
      language: string;
    }): Promise<void> {
      await sendI18nMail(email, language, 'verify-email', {
        'site-name': siteName,
        'verify-email-url': interpolate(actualUrls.verifyEmail, {
          'verification-token': verificationToken,
          'user-id': _id,
        }),
      });
    },
    async onVerify({ email, language }: { email: string; language: string }): Promise<void> {
      await sendI18nMail(email, language, 'email-verified', {
        'site-name': siteName,
      });
    },
    async onForgotPassword({
      email,
      passwordResetToken,
      _id,
      language,
    }: {
      email: string;
      passwordResetToken: string;
      _id: string;
      language: string;
    }): Promise<void> {
      await sendI18nMail(email, language, 'reset-password', {
        'site-name': siteName,
        'reset-password-url': interpolate(actualUrls.resetPassword, {
          'password-reset-token': passwordResetToken,
          'user-id': _id,
        }),
      });
    },
    async onResetPassword({ email, language }: { email: string; language: string }): Promise<void> {
      await sendI18nMail(email, language, 'password-reset', {
        'site-name': siteName,
      });
    },
    async onChangePassword({ email, language }: { email: string; language: string }): Promise<void> {
      await sendI18nMail(email, language, 'password-changed', {
        'site-name': siteName,
      });
    },
  };
}
