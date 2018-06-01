const { getI18n } = require('ooth-i18n')

const DEFAULT_TRANSLATIONS = {
  en: require('../i18n/en.json'),
}
const DEFAULT_LANGUAGE = 'en'

module.exports = function({ language, translations } = {}) {
  const __ = getI18n(translations || DEFAULT_TRANSLATIONS, language || DEFAULT_LANGUAGE)

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
    registerProfileField('roles')
    registerMethod('set', requireLogged, function(req, res) {
      const {
        userId,
        roles,
      } = req.body

      if (!req.user[name] || !req.user[name].roles || req.user[name].roles.indexOf('admin') == -1) {
        throw new Error(__('no_admin', null, req.locale))
      }

      return updateUser(userId, {
        roles,
      }).then(() => {
        return getUserById(req.user._id)
      }).then(user => {
        return res.send({
          message: __('roles_set', null, req.locale),
          user: getProfile(user),
        })
      })
    })
  }
}
