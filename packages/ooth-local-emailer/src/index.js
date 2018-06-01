const { getI18n, interpolate } = require('ooth-i18n')

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
    defaultLanguage,
}) {
    if (!urls) {
        urls = DEFAULT_URLS
    }
    if (!translations) {
        translations = DEFAULT_TRANSLATIONS
    }

    const __ = getI18n(translations, defaultLanguage || DEFAULT_LANGUAGE)

    const sendI18nMail = (email, language, name, values) => sendMail({
        from,
        to: email,
        subject: __(`${name}.subject`, values, language),
        body: __(`${name}.body`, values, language),
        html: __(`${name}.html`, values, language),
    })
    return {
        onRegister({email, verificationToken, _id, language}) {
            sendI18nMail(email, language, 'welcome', {
                'site-name': siteName,
            })
            sendI18nMail(email, language, 'verify-email', {
                'site-name': siteName,
                'verify-email-url': interpolate(urls.verifyEmail, {
                    'verification-token': verificationToken,
                    'user-id': _id,
                }),
            })
        },
        onGenerateVerificationToken({email, verificationToken, _id, language}) {
            sendI18nMail(email, language, 'verify-email', {
                'site-name': siteName,
                'verify-email-url': interpolate(urls.verifyEmail, {
                    'verification-token': verificationToken,
                    'user-id': _id,
                }),
            })
        },
        onSetEmail({email, verificationToken, _id, language}) {
            sendI18nMail(email, language, 'verify-email', {
                'site-name': siteName,
                'verify-email-url': interpolate(urls.verifyEmail, {
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
                'reset-password-url': interpolate(urls.resetPassword, {
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
