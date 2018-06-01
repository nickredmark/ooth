export function interpolate(string, values) {
    if (values) {
        for (const key of Object.keys(values)) {
            string = string.replace(new RegExp(`{${key}}`, 'g'), values[key])
        }
    }
    return string
}

export function i18n(translations, language, key, values = {}) {
    const parts = key.split('.')
    let current = translations[language]
    for (const part of parts) {
        if (current[part] === undefined) {
            throw Error(`Unknown translation ${language}.${key}.`)
        }
        current = current[part]
    }
    current = interpolate(current, values)
    return current
}

export const getI18n = (
    translations,
    defaultLanguage,
) => (
    key,
    values,
    language,
) => i18n(
    translations,
    language || defaultLanguage || Object.keys(translations)[0],
    key,
    values
)