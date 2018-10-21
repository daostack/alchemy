FROM client_builder:dev

RUN apk add --update --no-cache redis

COPY ops ops
COPY src src
COPY tsconfig.json tsconfig.json

ENTRYPOINT ["bash", "ops/cacher/entry.dev.sh"]
