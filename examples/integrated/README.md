# Integrated ooth

In this example, ooth is integrated in the API code (i.e. it doesn't run as a standalone microservice).

## API

The api is an express app with an ooth-authenticated graphql endpoint.

### Configs

Configs are handled via [node-config](https://github.com/lorenwest/node-config).

You can simply modify `./api/config/default.js` file or create `./api/config/local.js` file with your custom config.

See full configuration instructions on related [page](https://github.com/lorenwest/node-config/wiki/Configuration-Files)

### Start

Run

```js
cd api
yarn
yarn start
```

## Client

The client is a create-react-app that connects to the API.

Run (in a new terminal)

```js
cd client
yarn
yarn start
```
