# Integrated ooth

In this example, ooth is integrated in the API code (i.e. it doesn't run as a standalone microservice).

## Develop

### API

The api is an express app with an ooth-authenticated graphql endpoint.

#### Setup

```
cd api
cp .env.dist .env
vi .env # Or edit with your preferred editor
```

#### Start

Run

```js
cd api
yarn
yarn start
```

### Client

The client is a create-react-app that connects to the API.

Run (in a new terminal)

```js
cd client
yarn
yarn start
```

## Run with Docker-Compose

### Setup

Assuming you already have set up the `.env` file.

#### API

copy `.env` to `.env.docker` and set the db host to `db`, e.g.

```
MONGO_URL: mongodb://db:27017/ooth
```

```
docker-compose up
```
