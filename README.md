# Alchemy Client

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

The easiest way to start developing is to work with docker.  After you have installed docker, run the following steps:
```sh
docker-compose up alchemy
```
And in other terminal you will need to deploy the contracts:
```
npm run setup-env
```
This will start a server on http://127.0.0.1:3000.

To interact with the test instance in Chrome (or another browser):
1. Go to http://127.0.0.1:3000
1. Connect metamask to http://127.0.0.1:8545.
1. If you'd like an account with some ether to start with,  choose "import account" and use the following private key:
 `6695C8EF58FECFC7410BF8B80C17319EAACA8B9481CC9C682FD5DA116F20EF05`

See [working with docker](./docs/docker.md) for details.

## Using Ganache with MetaMask


First you must install Metamask and configure an account.
1. Install and enable [MetaMask extension](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en) in Chrome
1. Click on the MetaMask extension icon in the toolbar and log in
1. Click on the avatar icon int he top right, and choose "Import Account"
1. Choose "Private Key" and paste the string `0x8d4408014d165ec69d8cc9f091d8f4578ac5564f376f21887e98a6d33a6e3549` and click "Import"
1. Give it a name like "Alchemy Test Account" so you won't get confused later
1. Make sure that Metamask is connected to `127.0.0.1:8545` (choose from the "Networks" picklist in Metamask)

Now you are ready to start the server:

1. Run `npm run ganacheDb` in one terminal tab
1. In a separate tab run `npm run migrate-ganache`
1. Run `npm run start`
1. Go to http://127.0.0.1:3000/ in Chrome


# Regular end users - use MetaMask

* Go to https://alchemy.daostack.io
* Install [Metamask](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en) or the [Parity Chrome Extension](https://chrome.google.com/webstore/detail/himekenlppkgeaoeddcliojfddemadig)
* In MetaMask switch to the desired network.
* Unlock your account
