FROM node
WORKDIR /opt/

COPY index.js .
COPY mail.js .
COPY settings.js .
COPY package.json .
COPY yarn.lock .

RUN yarn

# Yarn doesn't like Docker's CMD syntax ['yarn','start']
CMD yarn start