# DAOStack Alchemy 

[![Build Status](https://travis-ci.com/daostack/alchemy.svg?branch=dev)](https://travis-ci.com/daostack/alchemy)

## Dependencies:
* [NVM](https://github.com/creationix/nvm#installation) can be helpful to manage different versions of node
* [NodeJS 9.4 or greater + NPM](https://github.com/creationix/nvm#usage)
* You will  need [alchemy-server](https://github.com/daostack/alchemy-server) running locally for the app to function

## Installation

```sh
sudo apt-get install -y libsecret-1-dev
git clone https://github.com/daostack/alchemy.git
cd alchemy
npm install
```

# Run app locally

There are two ways to work with the alchemy stack.
We are providing a convenient `docker-compose` file for quick setup. Alternatively,
you can recreate the docker environment by installing an starting all [services locally](./docs/nodocker.md).

## Working with docker

The easiest way to start developing is to work with docker.
Here is a quick setup; there are more detailed instructions in [here](./documentation/development.md).

After you have installed docker, run the following command:
```sh
docker-compose up alchemy
```
And in other terminal you will need to deploy the contracts:
```
npm run setup-env
```
This will start a server on http://127.0.0.1:3000.

See [working with docker](./docs/docker.md) for details.

## Interacting with your test instance using MetaMask

1. Install and enable [MetaMask extension](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en) in Chrome
1. Click on the MetaMask extension icon in the toolbar and log in
1. Click on the avatar icon in the top right, and choose "Import Account"
1. Choose "Private Key" and paste the string `0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d` and click "Import"
1. Give it a name like "Alchemy Test Account" so you won't get confused later
1. If you need more than one test account you can also import these private keys: `0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1`, `0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c` and `0x646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913`. Make sure to give them all differnent names.
1. Make sure that Metamask is connected to `127.0.0.1:8545` (choose from the "Networks" picklist in Metamask)
1. Go to http://127.0.0.1:3000 to load Alchemy
