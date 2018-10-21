FROM client_builder:dev

COPY ops ops
COPY src src
COPY build build
COPY tsconfig.json tsconfig.json

ENTRYPOINT ["webpack-dev-server"]
CMD ["--config", "ops/client/webpack.dev.js"]
