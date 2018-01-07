FROM node
WORKDIR /opt/

COPY . ./
RUN yarn

# Yarn doesn't like Docker's CMD syntax ['yarn','start']
CMD yarn start