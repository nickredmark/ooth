FROM node:10

# Prepare app directory
RUN mkdir -p /api

WORKDIR /api

COPY ./docker-entrypoint.sh /

RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]

