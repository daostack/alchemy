# Your development environment

There are different ways a developer can use the docker environment for development.

Probably the most straightfoward is to run the services that alchemy depends on in one terminal,
and run the alchemy server in a seperate terminal:
```sh
  docker-compose build
  docker-compose up graph-node alchemy-server # start the services needed by alchemy
  # in another terminal run:
  npm run setup-env
  npm run start # start the development server
  # ...  point your browser to 127.0.0.1:3000
  # ... develop away
  # ... commit your changes
  docker-compose down -v
```
Alternatively you can run the webserver inside the `alchemy` container
```sh
  docker-compose build # run this the first time, or if you changed package.json
  docker-compose up # start all the containers
  # in another shell run this:
  npm run setup-env # deploy contracts, configure subgraph...
  # ...  point your browser to 127.0.0.1:3000
  # ... develop away
  # ... commit your changes
  docker-compose down -v
```

See [docker](./docker.md) for details about the docker containers.

*Due to a bug in ganache, the state is not persistent, so you must re-run `npm run setup-env` after you (re-)start docker (TBD: link to issue)*

# Developing @daostack/client in tandem with alchemy

## The setup

Download and install the client package and use `npm link` for local development
```sh
# get the dev branch ofthe client repository
git clone https://github.com/daostack/client.git#dev
cd client
npm install
npm run build
npm link
cd ../alchemy # cd to the alchemy directory
npm link @daostack/client
```
Now you should find a link to your local `client` directory in `node_modules/@daostack/client`

## The development cycle

The alchemy webpack process uses the compiled `.js` files in `@daostack/client/dist`.
That means that when you make changes in the typescript `.ts` files in the client library, they will not be picked up until they are compiled to new `dist/*.js` files. You can do that by running:
```sh
npm run build:watch
```
