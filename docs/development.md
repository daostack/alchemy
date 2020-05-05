# Your development environment

There are different ways a developer can use the docker environment for development.

Probably the most flexible way is to run the services that alchemy depends on in one terminal,
and run the alchemy server in a separate terminal:

```sh
  # run this only if package.json has changed
  docker-compose build --no-cache

  # start the services needed by alchemy
  docker-compose up graph-node

  # in another terminal run:
  npm run start # start the development server

  # browse to 127.0.0.1:3000, OPEN AND UNLOCK METAMASK
  # ... develop away
  # ... commit your changes

  # shutdown docker
  docker-compose down
  docker-compose down
```

Alternatively you can run the webserver inside the `alchemy` container. This is how the tests on travis are run.

```sh
  docker-compose build # run this if package.json has changed
  docker-compose up alchemy # start alchemy and all the containers that depend on it
  # in another shell run this:
  # ...  point your browser to 127.0.0.1:3000, OPEN AND UNLOCK METAMASK and connect to localhost:8545
  # ... develop away
  # ... commit your changes
  docker-compose down
```

See [docker](./docker.md) for details about the docker containers.


# Helpful scripts

# Developing @daostack/arc.js in tandem with alchemy with npm link

## The setup

Download and install the arc.js package and use `npm link` for local development
```sh
# get the dev branch from the arc.js repository
git clone https://github.com/daostack/arc.js.git#dev
cd arc.js
npm install
npm run build
npm link
cd ../alchemy # cd to the alchemy directory
npm link @daostack/arc.js
```
Now you should find a link to your local `arc.js` directory in `node_modules/@daostack/arc.js`

## The development cycle

The alchemy webpack process uses the compiled `.js` files in `@daostack/arc.js/dist`.
That means that when you make changes in the typescript `.ts` files in the arc.js library, they will not be picked up until they are compiled to new `dist/*.js` files. You can do that by running:
```sh
npm run build:watch
```

# Troubleshooting

- `npm run service-status` will check quickly if all services are responding as expected.
- `docker-compose logs graph-node` will show the logs of the graph-node docker container (check the `docker-compose.yml` file for the names of the other containers)
- On Travis, there is a `Debug Info` section that is logged that contains some useful information
- if `docker build` or `docker-compose` are failing for some unfathomable reason, you can kill and clear out all existing containers and associated data, to force docker to start from scratch (**WARNING** this will operate on **all** containers and associated data, not just those used by Alchemy).  These are linux commands:
    ```sh
    docker kill $(docker ps -a -q)
    docker rm $(docker ps -a -q)
    docker rmi $(docker images -a -q)
    ```
