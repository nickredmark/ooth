module.exports = function() {
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
        throw new Error(`Only an admin can set roles.`)
      }

      return updateUser(userId, {
        roles,
      }).then(() => {
        return getUserById(req.user._id)
      }).then(user => {
        return res.send({
          message: 'Roles set.',
          user: getProfile(user),
        })
      })
    })
  }
}
