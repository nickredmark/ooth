const { getI18n } = require('ooth-i18n')

const DEFAULT_TRANSLATIONS = {
  en: require('../i18n/en.json'),
}
const DEFAULT_LANGUAGE = 'en'

module.exports = function({
  fields,
  defaultLanguage,
  translations,
}) {
  const __ = getI18n(translations || DEFAULT_TRANSLATIONS, defaultLanguage || DEFAULT_LANGUAGE)

  return function({
    name,
    registerPassportMethod,
    registerMethod,
    registerUniqueField,
    registerProfileField,
    getProfile,
    getUserByUniqueField,
    getUserById,
    getUserByFields,
    getUniqueField,
    updateUser,
    insertUser,
    requireLogged,
    requireNotLogged,
    requireNotRegistered,
    requireRegisteredWithThis
  }) {
    for (const name of Object.keys(fields)) {
      registerProfileField(name)
    }
    registerMethod('update', requireLogged, function(req, res) {
      const body = req.body
      for (const name of Object.keys(body)) {
        if (!fields[name]) {
          throw new Error(__('invalid_field', { name }, req.locale))
        }

        const field = fields[name]
        if (field.validate) {
          field.validate(body[name], req.user)
        }
      }

      return updateUser(req.user._id, body)
        .then(() => {
          return getUserById(req.user._id)
        }).then(user => {
          return res.send({
            message: __('profile_updated', null, req.locale),
            user: getProfile(user)
          })
        })
    })
  }
}
