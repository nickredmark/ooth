function replace(string, values) {
    for (const key of Object.keys(values)) {
        string = string.replace(new RegExp(`{${key}}`, 'g'), values[key])
    }
    return string
}

function i18n(translations, language, key, values = {}) {
    const parts = key.split('.')
    let current = translations[language]
    for (const part of parts) {
        if (current[part] === undefined) {
            throw Error(`Unknown translation ${language}.${key}.`)
        }
        current = current[part]
    }
    current = replace(current, values)
    return current
}

const DEFAULT_LANGUAGE = 'en'
const DEFAULT_URLS = {
    verifyEmail: '/verify-email?token={verification-token}&userId={user-id}',
    resetPassword: '/reset-password?token={password-reset-token}&userId={user-id}'
}
const DEFAULT_TRANSLATIONS = {
    en: require('../i18n/en.json')
}

module.exports = function({
    from,
    siteName,
    url,
    sendMail,
    translations,
    urls,
}) {
    if (!urls) {
        urls = DEFAULT_URLS
    }
    if (!translations) {
        translations = DEFAULT_TRANSLATIONS
    }
    const __ = (language, key, values) => i18n(translations, language || DEFAULT_LANGUAGE, key, values)

    const sendI18nMail = (email, language, name, values) => sendMail({
        from,
        to: email,
        subject: __(language, `${name}.subject`, values),
        body: __(language, `${name}.body`, values),
        html: __(language, `${name}.html`, values),
    })
    return {
        onRegister({email, verificationToken, _id, language}) {
            sendI18nMail(email, language, 'welcome', {
                'site-name': siteName,
            })
            sendI18nMail(email, language, 'verify-email', {
                'site-name': siteName,
                'verify-email-url': replace(urls.verifyEmail, {
                    'verification-token': verificationToken,
                    'user-id': _id,
                }),
            })
        },
        onGenerateVerificationToken({email, verificationToken, _id, language}) {
            sendI18nMail(email, language, 'verify-email', {
                'site-name': siteName,
                'verify-email-url': replace(urls.verifyEmail, {
                    'verification-token': verificationToken,
                    'user-id': _id,
                }),
            })
        },
        onSetEmail({email, verificationToken, _id, language}) {
            sendI18nMail(email, language, 'verify-email', {
                'site-name': siteName,
                'verify-email-url': replace(urls.verifyEmail, {
                    'verification-token': verificationToken,
                    'user-id': _id,
                }),
            })
        },
        onVerify({email, language}) {
            sendI18nMail(email, language, 'email-verified', {
                'site-name': siteName,
            })
        },
        onForgotPassword({email, passwordResetToken, _id, language}) {
            sendI18nMail(email, language, 'reset-password', {
                'site-name': siteName,
                'reset-password-url': replace(urls.resetPassword, {
                    'password-reset-token': passwordResetToken,
                    'user-id': _id,
                }),
            })
        },
        onResetPassword({email, language}) {
            sendI18nMail(email, language, 'password-reset', {
                'site-name': siteName,
            })
        },
        onChangePassword({email, language}) {
            sendI18nMail(email, language, 'password-changed', {
                'site-name': siteName,
            })
        }
    }
}
