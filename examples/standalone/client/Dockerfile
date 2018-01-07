FROM node
WORKDIR /opt/

COPY . ./
RUN yarn
RUN yarn build

RUN ls

# Yarn doesn't like Docker's CMD syntax ['yarn','start']
CMD yarn start