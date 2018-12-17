FROM builder:dev

RUN apk add --update --no-cache redis

COPY package.json package.json
COPY node_modules node_modules
COPY ops/cacher/entry.prod.sh entry.sh
COPY build/cacher.prod.js cacher.js

ENTRYPOINT ["bash", "entry.sh"]
