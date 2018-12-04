# Working with docker

## Install docker

## Run the containers

[*disclaimer* At the moment of writing, the docker setup is mostly for developers and for travis, not for a production environment]


The `docker-compose up` command will build and start up a number of different container with services that alchemy needs to function well


| name    | port |  Description  |
|---------|------|---------------|
| alchemy | 3000 | The main application | 
| alchemy-server | 3001 | A database that stores specific alchemy info
| ganache |  8545 | An ethereum node for testing
| graph-node (http) | 8000 | The graph node aggregates data from Ethereum
| graph-node (websocket) | 8001 |
| graph-node (rpc) | 8020 |
| ipfs | 5001|

After you finish working with the containers, do not forget to shut down the containers
```sh
docker-compose down -v
```

## Working with the containers

When started without argument, `docker-compose` will show the logs of all services.
When developing, you will probably be mostly interested in the output of the React server, and you would start the docker stack like this:
```sh
docker-compose up alchemy
```
The docker container will mount the current directly in the docker container
(except for the files and directories from `.dockerignore`; for example the `node_modules` directory is not mounted).
In practice, that means that you just edit the files on your local filesystem, and the alchemy server
in the docker container will notice these changes and restart if necessary.

However, if you make any changes that involve upgrading or install new packages
(that is, if you make changes in `package.json` that require an `npm install`),
you will need to rebuild the containers with the following command:
```sh
docker-compose build
```
As the builds can be very slow, we can also rebuild a specific containers
```sh
docker-compose build alchemy
```


To run commands directly on a running container, you can run:
```sh
docker-compose exec alchemy /bin/bash
```

## Docker Services
