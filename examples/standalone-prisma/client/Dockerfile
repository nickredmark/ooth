FROM node:10

# Prepare app directory
RUN mkdir -p /client

WORKDIR /client

COPY ./docker-entrypoint.sh /

RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]

