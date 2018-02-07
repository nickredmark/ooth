# Standalone ooth

In this example, ooth is a standalone microservice.

## Ooth

Standalone Ooth server with

* Guest login
* Local login

### Setup

Configs are handled via [node-config](https://github.com/lorenwest/node-config).

You can simply modify `./ooth/config/default.js` file or create `./ooth/config/local.js` file with your custom config.

See full configuration instructions on related [page](https://github.com/lorenwest/node-config/wiki/Configuration-Files)

```
cd ooth
yarn
```

### Start

```
yarn start
```

Open `http://localhost:3000` to see a list of available routes. E.g. try out `http://localhost:3000/status`

To be used in conjunction with [ooth-create-react-app](../ooth-create-react-app)


## API

This is an example of a protected graphql API,
to which the user will need to authenticate using a JWT.

### Setup

Configs are handled via [node-config](https://github.com/lorenwest/node-config).

You can simply modify `./config/default.js` file or create `./config/local.js` file with your custom config.

See full configuration instructions on related [page](https://github.com/lorenwest/node-config/wiki/Configuration-Files)


```
cd api
yarn
```

### Start

Run

```
yarn start
```

The GraphQL endpoint is `/graphql`. Visit `/graphiql` to play with the data.

Notice how you can query posts and comments, but not insert any without having logged in.

## Client

The client is a create-react-app that connects to the API.

Run (in a new terminal)

```
cd client
yarn
yarn start
```
