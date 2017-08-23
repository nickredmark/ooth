# OOTH - a user identity management system

Join the [Slack Channel](https://ooth.slack.com/)!

Get news about ooth on [ooth's twitter account](https://twitter.com/oothjs).

Read the newest article [Staart - a starter library for node.js projects with user accounts](https://medium.com/@nmaro/staart-a-starter-library-for-node-js-projects-with-user-accounts-d1328b46a59).

Introducing medium article: [Ooth - user accounts for node.js](https://medium.com/the-ideal-system/ooth-user-accounts-for-node-js-93cfcd28ed1a#.97kyfg4xg).

NOTE: Until version 1.0.0 is reached, the API will be unstable and can't be considered safe for production.

## Staart

If you want to integrate this library with a GUI, you might want to check out the sister project [Staart](https://github.com/nmaro/staart).

## Examples

The most up-to-date example, complete with a starting UI with all the main user account flow can now be found in the [staart project](https://github.com/nmaro/staart)!

* [ooth](examples/ooth) - an ooth microservice instantiation
* [graphql-api-with-auth](examples/graphql-api-with-auth) - an example graphql api with JWT auth
* [graphql-api-with-ooth](examples/graphql-api-with-ooth) - same example graphql api but with ooth embedded as library
* [ooth-create-react-app](examples/ooth-create-react-app) - an ooth client integration with create-react-app, connecting to [ooth](examples/ooth) and [graphql-api-with-auth](examples/graphql-api-with-auth)
* [ooth-create-react-app-embedded](examples/ooth-create-react-app-embedded) - same example but connecting to [graphql-api-with-ooth](examples/graphql-api-with-ooth)
* [ooth-next-with-api](examples/ooth-next-with-api) - an integration with next.js, where ooth server and api are all part of the same service

## Packages

Find more documentation in the readmes of the individual packages.

### Core Packages

* [ooth](packages/ooth): extensible server package
* [ooth-client](packages/ooth-client): client package

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
