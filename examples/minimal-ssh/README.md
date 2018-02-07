# Minimal ooth example

This example is the same as [minimal](../minimal) but with https enabled. Anyway, I'd recommend you set up https with nginx instead of within the app.

## Generate self signed certificate for localhost

```
mkdir keys
cd keys
openssl req -x509 -newkey rsa:4096-keyout key.pem -out cert.pem -days 365 -nodes -subj '/CN=localhost'
```

## Start

```
yarn
yarn start
```