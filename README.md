# OOTH - a user identity management system

Get news about ooth on [ooth's twitter account](https://twitter.com/oothjs).

Introducing medium article: [Ooth - user accounts for node.js](https://medium.com/the-ideal-system/ooth-user-accounts-for-node-js-93cfcd28ed1a#.97kyfg4xg).

NOTE: Until version 1.0.0 is reached, the API will be unstable and can't be considered safe for production.

## Roadmap

A roadmap can be found in the [ooth github projects](https://github.com/nmaro/ooth/projects/1).

## Examples

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

* [ooth-guest](packages/ooth-guest): login as a guest, no credentials needed (built-in)
* [ooth-local](packages/ooth-local): login with email/password
* [ooth-faceboook](packages/ooth-facebook)
* [ooth-google](packages/ooth-google)

### Client Packages

* [ooth-client](packages/ooth-client): ooth client
* [ooth-client-react](packages/ooth-client-react): react utilities for ooth

### Feature requests, Bugs, Contributions

Start an issue here https://github.com/nmaro/ooth/issues.