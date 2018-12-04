# Your development environment

Here is a typical session:
```sh
  docker-compose build # run this the first time, or if you changed package.json
  docker-compose up # start the containers
  npm run configure-dev-env # create some configuration files on ./config
  # ...  point your browser to 127.0.0.1:3000
  # ... develop away
  # ... commit your changes
  docker-compose down -v
```

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
npm run build
```
TBD: define a watcher process so we can do `npm run build:watch` and forget about it.
