FROM node
WORKDIR /opt/

COPY public ./public/
COPY src ./src/
COPY package.json .
COPY yarn.lock .

RUN yarn
RUN yarn build

# Yarn doesn't like Docker's CMD syntax ['yarn','start']
CMD yarn start