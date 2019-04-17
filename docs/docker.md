# Working with docker

## Install docker
You will need both docker as well as docker-compose.

## Run the containers

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
docker-compose down
```

## If you just want to see it running

When started without argument, `docker-compose` will show the logs of all services.

For a quick look at the state of the application, you can start all the services needed for Alchemy with the following commands:
```sh
docker-compose build
docker-compose up alchemy
```
You can skip the build step if no files have changed.


To run commands directly on a running container, you can run:
```sh
docker-compose exec alchemy /bin/bash
```
## Working with docker in development


For development, it makes sense to start the Alchemy services separately with the following command:

```sh
docker-compose up alchemy-server graph-node
```
In a separate terminal, you can then run
```
npm run start
```
which will start the development server.


## Troubleshooting
