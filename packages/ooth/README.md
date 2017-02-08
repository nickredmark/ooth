# Ooth - user accounts microservice

```
const express = require('express')
const Ooth = require('ooth')
const oothFacebook = require('ooth-facebook')

const app = express()

const ooth = new Ooth(app, {
    mongoUrl: MONGO_URL
})

ooth.use('facebook', oothFacebook({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: FACEBOOK_CALLBACK_URL
}))

app.listen(PORT)
```

## Writing strategies

```
ooth.use(strategyName, strategy)
```

`strategy` will be called once like this

```
strategy({
    name,
    registerPassportMethod,
    registerMethod,
    registerUniqueField,
    getUserById,
    getUserByUniqueField,
    getUserByFields,
    updateUser,
    insertUser,
    requireLogged,
    requireNotLogged,
    requireNotRegistered,
    requireRegisteredWithThis
})
```

`name` is the strategyName given when calling `ooth.use`

`registerPassportMethod(methodName, ...middleware, methodHandler)` adds a method to the API,
available at the URL `/strategyName/methodName`. `middleware` can be any express.js middleware, that gets called before the handler.
Useful middleware are `requireLogged`, `requireNotLogged`, `requireNotRegistered`
which return an error if their conditions are not met. `methodHandler` will be registered as a passport.js strategy as in `passport.use(strategyName-methodName, handler)`

`registerMethod/methodName, ...middleware, handler)` adds a method to the API, available at the URL `/strategyName/methodName`,
`middleware` and `handler` are just normal express.js middleware and handlers

`registerUniqueField(fieldId, fieldName)` registers a field that will be searchable across services.

`getUserById` searches a user by id

`getUserByUniqueField(fieldId, value)` searches a user by a field as registered with `registerUniqueField` across services.

`getUserByFields(fields)` searches a user by the given fields, as scoped within the strategy name.

`updateUser(_id, fields)` updates the given fields of a user, as scoped within the strategy name, i.e.
`updateUser(_id, {email: 'newemail@example.com'})` from strategy `local` actually updates field `local.email`.

`requireLogged`, `requireNotLogged`, `requireNotRegistered`, `requireRegisteredWithThis` are middleware that can be used with the `register[Passport]Method` functions.