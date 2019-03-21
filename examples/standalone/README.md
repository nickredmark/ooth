# Standalone ooth

In this example, ooth is a standalone microservice.

## Development

### Ooth

Standalone Ooth server with

* Guest login
* Local login

#### Setup

```
cd ooth
cp .env.dist .env
vi .env # Or edit with editor of your choice
yarn
```

#### Start

```
yarn start
```

### API

This is an example of a protected graphql API,
to which the user will need to authenticate using a JWT.

#### Setup

```
cd api
cp .env.dist .env
vi .env # Or edit with editor of your choice
yarn
```

#### Start

Run

```
yarn start
```

The GraphQL endpoint is `/graphql`. Visit `/graphiql` to play with the data.

Notice how you can query posts and comments, but not insert any without having logged in.

### Client

The client is a create-react-app that connects to the API.

Run (in a new terminal)

```
cd client
yarn
yarn start
```

## Run with Docker-Compose

### Setup

Assuming you already have set up the `.env` files.

#### Ooth

copy `.env` to `.env.docker` and set the db host to `db`, e.g.

```
MONGO_URL: mongodb://db:27017/ooth
```

#### API

copy `.env` to `.env.docker` and set the db host to `db`, e.g.

```
MONGO_URL: mongodb://db:27017/ooth
```

```
docker-compose up
```
