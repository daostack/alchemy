FROM alchemy_builder:dev

RUN yarn global add webpack-dev-server

COPY package.json package.json
COPY ops ops
COPY src src
COPY build build
COPY tsconfig.json tsconfig.json

ENTRYPOINT ["webpack-dev-server"]
CMD ["--config", "ops/client/webpack.dev.js"]
