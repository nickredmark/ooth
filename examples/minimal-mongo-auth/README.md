# Minimal ooth example

This is a minimal vanilla javascript ooth example intended for learning. Note that

* on the client side one would rater use the `ooth-client` library instead of performing requests by hand.
* all testcredentials are stored plaintext in the code. One would extract them to a separate unchecked config file (or in environment variables) in a serious app.

Refer to other examples for more sophisticated setups.

## Run example

Set up your mongodb with authentication.

To quickly set up a test mongodb with auth you can use this docker image (ignore if you already have a mongodb with authentication):

```
  docker run -it \
    -e AUTH=yes \
    -e MONGODB_ADMIN_USER=admin \
    -e MONGODB_ADMIN_PASS=adminpass \
    -e MONGODB_APPLICATION_DATABASE=ooth-minimal-auth \
    -e MONGODB_APPLICATION_USER=username \
    -e MONGODB_APPLICATION_PASS=userpass \
    -p 27017:27017 aashreys/mongo-auth:latest
```

## Start

```
yarn
yarn start
```