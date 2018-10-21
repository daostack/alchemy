FROM client_builder:dev

RUN apk add --update --no-cache redis

COPY ops/cacher/entry.prod.sh entry.sh
COPY build/cacher.prod.js cacher.js

ENTRYPOINT ["bash", "entry.sh"]
