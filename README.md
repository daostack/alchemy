# Alchemy Client

## Dependencies:
* [NVM](https://github.com/creationix/nvm#installation)
* [NodeJS 9.1 or greater + NPM](https://github.com/creationix/nvm#usage)
* [Yarn](https://yarnpkg.com/en/) - `curl -o- -L https://yarnpkg.com/install.sh | bash`

## Installation
* `yarn`

# Run app locally

## Working with Ganache without MetaMask
1. Switch off chrome extensions such as MetaMask or Parity extension
2. Run `yarn ganache` in one terminal tab
3. In a separate tab run `yarn migrate-ganache`
4. Run `yarn start-ganache`
5. Go to http://localhost:3000/ in your favorite browser

## Working with Ganache and MetaMask
1. Install and Enable the [MetaMask extension](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en) in Chrome
2. Run `yarn ganacheDb` in one terminal tab
3. In a separate tab run `yarn migrate-ganache`
4. Run `yarn start-ganache`
5. Go to http://localhost:3000/ in Chrome
6. Click on the MetaMask extension icon in the toolbar
7. Click on Restore from Seed Phrase
8. Enter `behave pipe turkey animal voyage dial relief menu blush match jeans general` into the box labeled Wallet Seed, and any password you want.
9. Now all transactions will require confirmation through MetaMask

## Working with Kovan testnet locally (XXX: Not working with current version of Arc + ArcJS)
1. Install parity - `bash <(curl https://get.parity.io -Lk)`
2. Create a file in the root of the project called 'kovan_pass.txt' with your parity wallet password
3. Run `parity --no-warp --unlock KOVAN_ACCOUNT_PUBLIC_ADDRESS --password kovan_pass.txt --chain=kovan` in one terminal tab
4. Run `yarn start-kovan` in a separate tab
5. Go to http://localhost:3000/ in your favorite browser

# Regular end users

* Install [Metamask](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en) or the [Parity Chrome Extension](https://chrome.google.com/webstore/detail/himekenlppkgeaoeddcliojfddemadig)
* In MetaMask - Make sure to switch the network to kovan
