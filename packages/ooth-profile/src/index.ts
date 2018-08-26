import { getI18n, Translations } from 'ooth-i18n';
import { Ooth, User } from 'ooth';

const DEFAULT_TRANSLATIONS = {
  en: require('../i18n/en.json'),
};
const DEFAULT_LANGUAGE = 'en';

type Options = {
  name?: string;
  ooth: Ooth;
  fields: {
    [field: string]: {
      validate?: (value: any, user: User) => void;
    };
  };
  defaultLanguage?: string;
  translations?: Translations;
};

export default function({ name = 'profile', ooth, fields, defaultLanguage, translations }: Options): void {
  const __ = getI18n(translations || DEFAULT_TRANSLATIONS, defaultLanguage || DEFAULT_LANGUAGE);

  ooth.registerProfileFields(name, ...Object.keys(fields));
  ooth.registerMethod(
    name,
    'update',
    [ooth.requireLogged],
    async (body: any, user: User | null, locale: string): Promise<{ message: string }> => {
      for (const name of Object.keys(body)) {
        if (!fields[name]) {
          throw new Error(__('invalid_field', { name }, locale));
        }

        const field = fields[name];
        if (field.validate) {
          field.validate(body[name], user!);
        }
      }

      await ooth.updateUser(name, user!._id, body);
      return {
        message: __('profile_updated', null, locale),
      };
    },
  );
}
