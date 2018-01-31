# Ooth Server example

Standalone Ooth server with

* Guest login
* Local login

## Setup

Configs are handled via [node-config](https://github.com/lorenwest/node-config).

You can simply modify `./config/default.js` file or create `./config/local.js` file with your custom config.

See full configuration instructions on related [page](https://github.com/lorenwest/node-config/wiki/Configuration-Files)

```
yarn
```

### Start

```
yarn start
```

Open `http://localhost:3000` to see a list of available routes. E.g. try out `http://localhost:3000/status`

To be used in conjunction with [ooth-create-react-app](../ooth-create-react-app)
