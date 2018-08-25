import { Response } from 'express';
import { FullRequest, Ooth } from 'ooth';
import { getI18n, Translations } from 'ooth-i18n';

const DEFAULT_TRANSLATIONS = {
  en: require('../i18n/en.json'),
};
const DEFAULT_LANGUAGE = 'en';

type Config = {
  ooth: Ooth;
  language?: string;
  translations: Translations;
  name?: string;
};

export default function({ ooth, name = 'roles', language, translations }: Config): void {
  const __ = getI18n(translations || DEFAULT_TRANSLATIONS, language || DEFAULT_LANGUAGE);

  ooth.registerProfileFields(name, 'roles');
  ooth.registerMethod(
    name,
    'set',
    ooth.requireLogged,
    async (req: FullRequest, res: Response): Promise<void> => {
      const { userId, roles } = req.body;

      if (!req.user[name] || !req.user[name].roles || req.user[name].roles.indexOf('admin') === -1) {
        throw new Error(__('no_admin', null, req.locale));
      }

      await ooth.updateUser(name, userId, {
        roles,
      });
      const user = await ooth.getUserById(req.user._id);
      return res.send({
        message: __('roles_set', null, req.locale),
        user: ooth.getProfile(user),
      });
    },
  );
}
