export type Values = {
  [key: string]: string | number;
};

export type Translations = {
  [key: string]: string | Translations;
};

export function interpolate(s: string, values?: Values | null): string {
  let res = s;
  if (values) {
    for (const key of Object.keys(values)) {
      res = res.replace(new RegExp(`{${key}}`, 'g'), values[key] as string);
    }
  }
  return res;
}

export function i18n(translations: Translations, language: string, key: string, values?: Values | null): string {
  const parts = key.split('.');
  let current = translations[language];
  for (const part of parts) {
    if ((current as Translations)[part] === undefined) {
      throw Error(`Unknown translation ${language}.${key}.`);
    }
    current = (current as Translations)[part];
  }
  current = interpolate(current as string, values);
  return current;
}

export const getI18n = (translations: Translations, defaultLanguage: string) => (
  key: string,
  values?: Values | null,
  language?: string,
) => i18n(translations, language || defaultLanguage || Object.keys(translations)[0], key, values);
