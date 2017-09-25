Alchemy Client

# Run app locally

Dependencies:
* [NVM](https://github.com/creationix/nvm#installation)
* [NodeJS + NPM](https://github.com/creationix/nvm#usage)
* [Yarn](https://yarnpkg.com/en/) - `curl -o- -L https://yarnpkg.com/install.sh | bash`

`yarn install`
`git submodule init`

# Developer Development Environments

## Working with testrpc
1. Install [testrpc](https://github.com/ethereumjs/testrpc)
1. Switch off chrome extensions such as MetaMask or Parity extension OR have MetaMask listen to localhost:8545
2. Run `yarn testrpc` in one terminal tab
3. In a separate tab run `yarn testrpc`

## Regular end users

* Install [Metamask](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en) or the [Parity Chrome Extension](https://chrome.google.com/webstore/detail/himekenlppkgeaoeddcliojfddemadig)