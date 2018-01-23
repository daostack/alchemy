Alchemy Client

# Run app locally

## Dependencies:
* [NVM](https://github.com/creationix/nvm#installation)
* [NodeJS + NPM](https://github.com/creationix/nvm#usage)
* [Yarn](https://yarnpkg.com/en/) - `curl -o- -L https://yarnpkg.com/install.sh | bash`

## Installation
* `yarn`

# Development Environments

## Working with Ganache
1. Switch off chrome extensions such as MetaMask or Parity extension OR have MetaMask listen to localhost:8545
2. Run `yarn ganache` in one terminal tab
3. In a separate tab run `yarn migrate-ganache`
4. Run `yarn start-ganache`
5. Go to http://localhost:3000/ in your favorite browser

## Working with Kovan testnet locally (XXX: Not working with current version of Arc + ArcJS)
1. Install parity - `bash <(curl https://get.parity.io -Lk)`
2. Create a file in the root of the project called 'kovan_pass.txt' with your parity wallet password
3. Run `parity --no-warp --unlock KOVAN_ACCOUNT_PUBLIC_ADDRESS --password kovan_pass.txt --chain=kovan` in one terminal tab
4. Run `yarn start-kovan` in a separate tab
5. Go to http://localhost:3000/ in your favorite browser

## Regular end users

* Install [Metamask](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en) or the [Parity Chrome Extension](https://chrome.google.com/webstore/detail/himekenlppkgeaoeddcliojfddemadig)
* In MetaMask - Make sure to switch the network to kovan
