Alchemy Client

# Run app locally

## Dependencies:
* [NVM](https://github.com/creationix/nvm#installation)
* [NodeJS + NPM](https://github.com/creationix/nvm#usage)
* [Yarn](https://yarnpkg.com/en/) - `curl -o- -L https://yarnpkg.com/install.sh | bash`
* [DAOstack Solidity Contracts](https://github.com/daostack/daostack) - This is included as a submodule

## Installation
* `yarn install`
* `git submodule init`
* `git submodule update`

# Development Environments

## Working with testrpc
1. Install [testrpc](https://github.com/ethereumjs/testrpc)
2. Switch off chrome extensions such as MetaMask or Parity extension OR have MetaMask listen to localhost:8545
3. Run `yarn testrpc` in one terminal tab
4. In a separate tab run `yarn start-testrpc`

## Regular end users

* Install [Metamask](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en) or the [Parity Chrome Extension](https://chrome.google.com/webstore/detail/himekenlppkgeaoeddcliojfddemadig)
* In MetaMask - Make sure to switch the network to kovan
