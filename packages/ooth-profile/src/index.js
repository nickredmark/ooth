module.exports = function({
  fields,
}) {
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
          throw new Error(`Invalid field ${name}`)
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
            message: 'Profile updated.',
            user: getProfile(user)
          })
        })
    })
  }
}
