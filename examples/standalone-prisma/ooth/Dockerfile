FROM node:10

# Prepare app directory
RUN mkdir -p /ooth
RUN mkdir -p /packages

# Install dependencies
WORKDIR /ooth

COPY ./docker-entrypoint.sh /

RUN chmod +x /docker-entrypoint.sh

RUN yarn

ENTRYPOINT ["/docker-entrypoint.sh"]

# COPY package.json yarn.lock ./ooth

# RUN yarn

# COPY . .

# ENTRYPOINT [ "yarn" ]
# CMD [ "start" ]

