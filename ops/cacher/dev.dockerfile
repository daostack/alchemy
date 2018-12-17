FROM builder:dev

RUN apk add --update --no-cache redis
RUN yarn global add nodemon

COPY package.json package.json
COPY ops ops
COPY src src
COPY tsconfig.json tsconfig.json

ENTRYPOINT ["bash", "ops/cacher/entry.dev.sh"]
