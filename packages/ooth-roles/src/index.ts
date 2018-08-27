import { Ooth, StrategyValues } from 'ooth';
import { getI18n, Translations } from 'ooth-i18n';

const DEFAULT_TRANSLATIONS = {
  en: require('../i18n/en.json'),
};
const DEFAULT_LANGUAGE = 'en';

type Config = {
  ooth: Ooth;
  language?: string;
  translations?: Translations;
  name?: string;
};

export default function({ ooth, name = 'roles', language, translations }: Config): void {
  const __ = getI18n(translations || DEFAULT_TRANSLATIONS, language || DEFAULT_LANGUAGE);

  ooth.registerProfileFields(name, 'roles');
  ooth.registerMethod(
    name,
    'set',
    [ooth.requireLogged],
    async ({ userId, roles }: any, currentUserId: string | undefined, locale: string): Promise<{ message: string }> => {
      const user = await ooth.getUserById(currentUserId!);

      if (
        !user![name] ||
        !(user![name] as StrategyValues).roles ||
        (user![name] as StrategyValues).roles.indexOf('admin') === -1
      ) {
        throw new Error(__('no_admin', null, locale));
      }

      await ooth.updateUser(name, userId, {
        roles,
      });
      return {
        message: __('roles_set', null, locale),
      };
    },
  );
}
