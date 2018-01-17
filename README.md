# OOTH - a user identity management system

See the [project timeline](https://github.com/nmaro/ooth/projects/2).

Join the [Slack Channel](https://join.slack.com/t/ooth/shared_invite/enQtMjQ3MDE2ODA2NjE0LTE1NGNmN2YzZTdiMWNjODExZmNjYzg3ZGJjZmVmZmI2YjVhOWYzZDQ1NWI4Y2JiNzNlMmI2Y2U5ZWFhODIzMWQ)!

Get news about ooth on [ooth's twitter account](https://twitter.com/oothjs).

Read the newest article [Staart - a starter library for node.js projects with user accounts](https://medium.com/@nmaro/staart-a-starter-library-for-node-js-projects-with-user-accounts-d1328b46a59).

Introducing medium article: [Ooth - user accounts for node.js](https://medium.com/the-ideal-system/ooth-user-accounts-for-node-js-93cfcd28ed1a#.97kyfg4xg).

## Staart

If you want to integrate this library with a GUI, you might want to check out the sister project [Staart](https://github.com/nmaro/staart).

## Examples

There are many ways you can use ooth.

### Vanilla JS

A good starting point could be this minimal example. Reading through the two files of client and server code is recommended.

* [minimal](examples/minimal)

### Vue.js

The same minimal example as Vanilla JS, but using Vue.js. (https://vuejs.org/)

* [minimal-vue](examples/minimal-vue)

### With UI and next.js

The most complete example with a starting UI with all the main user account flow is programmed with next.js and can now be found in the [staart project](https://github.com/nmaro/staart)!

### With create-react-app

The following two examples use create-react-app as a client. If you don't want to use cra you can still analyze the server folders and the code parts that use ooth-client independently.

* [standalone](examples/standalone) - ooth runs as a microservice separate from api, auth transfer is done via JWT.
* [integrated](examples/integrated) - ooth runs in same process as api, no need for JWT.

## Packages

### Core Packages

* [ooth](packages/ooth): extensible server package
* [ooth-client](packages/ooth-client): client package

### Backends

* [ooth-mongo](packages/ooth-mongo): a MongoDB backend

### Strategies

* [ooth-guest](packages/ooth-guest): login as a guest, no credentials needed
* [ooth-local](packages/ooth-local): login with username/email/password
* [ooth-faceboook](packages/ooth-facebook): login with Facebook
* [ooth-google](packages/ooth-google): login with Google

### Client Packages

* [ooth-client](packages/ooth-client): ooth client
* [ooth-client-react](packages/ooth-client-react): react utilities for ooth
* [ooth-client-react-next](packages/ooth-client-react-next): next utilities for ooth
* [ooth-client-react-next-apollo](packages/ooth-client-react-next-apollo): apollo utilities for ooth in next

### Utilities

* [compose-next](packages/compose-next): utility to create providers that handle getInitialProps of children

## Feature requests, Bugs, Contributions

Start an issue here https://github.com/nmaro/ooth/issues.

## Support

Support the development of this project on [Patreon](https://www.patreon.com/nmaro).
