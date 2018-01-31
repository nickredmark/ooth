# A protected graphql API

This is an example of a protected graphql API, directly integrated with ooth as a library.
This example API needs to be running for these example projects to work:

* [ooth-create-react-app-embedded](../ooth-create-react-app-embedded)

## Start it

Configs are handled via [node-config](https://github.com/lorenwest/node-config).

You can simply modify `./config/default.js` file or create `./config/local.js` file with your custom config.

See full configuration instructions on related [page](https://github.com/lorenwest/node-config/wiki/Configuration-Files)

Run

```
yarn start
```

The GraphQL endpoint is `/graphql`. Visit `/graphiql` to play with the data.

Notice how you can query posts and comments, but not insert any without having logged in.

## Logging in with a client

[ooth-client](../../packages/ooth-client) of course is supposed to do all of this for you - see its usage in [ooth-create-react-app](../ooth-create-react-app).

## Logging in (low level)

To be able to login you need to start the companion example [ooth](../ooth) server.

Once started register as a guest:

```
curl -XPOST {oothserver}/guest/register
```

will get you a JWT token

then

```
curl -XPOST {apiserver}/login --header "Authorization: JWT {enterjwttokenhere}" -c -
```

this will print the session cookie created by the server
- if you had done this request in a browser you could now start performing write queries to the graphql api.
