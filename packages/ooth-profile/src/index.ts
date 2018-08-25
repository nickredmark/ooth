import { getI18n, Translations } from 'ooth-i18n';
import { Ooth, FullRequest, User } from 'ooth';
import { Response } from 'express';

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
    ooth.requireLogged,
    async (req: FullRequest, res: Response): Promise<void> => {
      const body = req.body;
      for (const name of Object.keys(body)) {
        if (!fields[name]) {
          throw new Error(__('invalid_field', { name }, req.locale));
        }

        const field = fields[name];
        if (field.validate) {
          field.validate(body[name], req.user);
        }
      }

      await ooth.updateUser(name, req.user._id, body);
      const user = await ooth.getUserById(req.user._id);
      return res.send({
        message: __('profile_updated', null, req.locale),
        user: ooth.getProfile(user),
      });
    },
  );
}
