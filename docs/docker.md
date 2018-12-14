# Working with docker

## Install docker

## Run the containers in development mode


The `docker-compose up` command will build and start up a number of different containers.
It will also print the output of all those containers to your terminal.
When developing, you will probably be mostly interested in the output of the React server  
that is defined in this repository, and you would start the docker stack like this:
```sh
docker-compose up alchemy
```
The docker container will mount the current directly in the docker container
(except for the files and directories from `.dockerignore`; for example the `node_modules` directory is not mounted).
In practice, that means that you just edit the files on your local filesystem, and the alchemy server
in the docker container will notice these changes and restart if necessary.

However, if you make any changes that involve upgrading or install new packages
(that is, if you make changes in `package.json` that require an `npm install`),
you will need to rebuild the container with the following command:
```sh
docker-compose build
```

To run commands directly on a running container, you can run:
```sh 
docker-compose exec alchemy /bin/bash
```

## NB
**NB: the alchemy server is not using the ganache process from the docker container called ganache; it is using a ganache instance
that is running in the alchemy container. This will be fixed pending an arc.js update**
