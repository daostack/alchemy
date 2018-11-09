# Alchemy Client

## Dependencies:
* [NVM](https://github.com/creationix/nvm#installation) can be helpful to manage different versions of node
* [NodeJS 9.4 or greater + NPM](https://github.com/creationix/nvm#usage)
* You will  need [alchemy-server](https://github.com/daostack/alchemy-server) running locally for the app to function

## Installation
```sh
git clone https://github.com/daostack/alchemy.git
cd alchemy
npm install
```

# Run app locally

## Run the Alchemy Server
Follow instructions [here](https://github.com/daostack/alchemy-server) to start the Alchemy Server

There are three ways of interacting with the test server, depending on how the account and private key of the user are managed.


## Using Ganache with MetaMask

In this mode, keys are handled by Metamask - every time the application sends a transaction, it will need to be confirmed by Metamask.
This is closest to the regular user experience of the application.

First you must install Metamask and configure an account.
1. Install and enable [MetaMask extension](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en) in Chrome
1. Click on the MetaMask extension icon in the toolbar and log in
1. Click on the avatar icon int he top right, and choose "Import Account"
1. Choose "Private Key" and paste the string `0x8d4408014d165ec69d8cc9f091d8f4578ac5564f376f21887e98a6d33a6e3549` and click "Import"
1. Give it a name like "Alchemy Test Account" so you won't get confused later
1. Make sure that Metamask is connected to `localhost:8545` (choose from the "Networks" picklist in Metamask)

Now you are ready to start the server:

1. Run `npm run ganacheDb` in one terminal tab
1. In a separate tab run `npm run migrate-ganache`
1. Run `npm run start`
1. Go to http://localhost:3000/ in Chrome

## Working with Ganache without MetaMask

1. Make sure plugins such as MetaMask or Parity extension are deactivated
1. Run `npm run auto-start-ganache`
1. Go to http://localhost:3000/ in your favorite browser


## Working with Kovan testnet and Parity locally
1. Install parity - `bash <(curl https://get.parity.io -Lk)`
1. Create a file in the root of the project called 'kovan_pass.txt' with your parity wallet password
1. Run `parity --no-warp --unlock KOVAN_ACCOUNT_PUBLIC_ADDRESS --password kovan_pass.txt --chain=kovan` in one terminal tab
1. Run `npm run start` in a separate tab
1. Go to http://localhost:3000/ in your favorite browser

# Regular end users - use MetaMask

* Go to https://alchemy.daostack.io
* Install [Metamask](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en) or the [Parity Chrome Extension](https://chrome.google.com/webstore/detail/himekenlppkgeaoeddcliojfddemadig)
* In MetaMask switch to the desired network. Note that we are only deployed on Kovan right now.
* Unlock your account
