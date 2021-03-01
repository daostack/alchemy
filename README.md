***DEVELOPMENT OF THIS PACKAGE HAS MOVED TO: https://github.com/daostack/alchemy-monorepo/tree/dev/packages/alchemy***

# DAOStack Alchemy

[![Build Status](https://travis-ci.org/daostack/alchemy.svg?branch=dev)](https://travis-ci.org/daostack/alchemy)

## URLs
https://v1.alchemy.do or https://alchemy.daostack.io - alchemy v1 on mainnet and xdai

https://rinkeby.v1.alchemy.do - alchemy v1 on rinkeby

https://kovan.v1.alchemy.do - alchemy v1 on kovan

**Alchemy 2.0** :fire:

Alchemy 2.0 source code can be found [here](https://github.com/daostack/alchemy_2).

https://alchemy.do - alchemy 2.0 on mainnet

https://xdai.alchemy.do - alchemy 2.0 on xdai 

https://rinkeby.alchemy.do - alchemy 2.0 on kovan

https://kovan.alchemy.do - alchemy 2.0 on rinkeby



**Alchemy is a budgeting and resource-allocation tool for decentralized organizations.** It is an interface that enables thousands of individuals to coordinate towards a common purpose, by proposing and deciding on how to spend funds in alignment with their goals and values.

Some example use cases for Alchemy include decentralized venture funds, charitable funds, innovation funds, a budget proposal system (like Dash but more sophisticated), or prioritizing features for an open-source project.

Alchemy is a Dapp (decentralized application) built on top of [DAOstack](https://github.com/daostack), a platform for decentralized governance of DAOs (decentralized autonomous organizations).

How does it work? **Alchemy makes it easy for DAO members to carry out three simple actions:**

1. **Make proposals** for the DAO to take a specific action. A proposal is equivalent to a project pitch and includes details about the proposal such as objectives, methods, costs and milestones.
2. **Predict** whether a proposal will be approved or rejected by the organization. This helps guide the collective voting process by sorting and prioritizing the proposals.
3. **Vote** on whether a proposal should be accepted or rejected.

While anyone can propose and predict, only people who hold reputation (voting power) can vote.

## Dependencies:
* [NVM](https://github.com/creationix/nvm#installation) can be helpful to manage different versions of node
* [NodeJS 12.6.2 or greater + NPM](https://github.com/creationix/nvm#usage)

## Installation

```sh
sudo apt-get install -y libsecret-1-dev
git clone https://github.com/daostack/alchemy.git
cd alchemy
npm ci
```

# Run app locally

There are two ways to work with the alchemy stack.
We are providing a convenient `docker-compose` file for quick setup. Alternatively,
you can recreate the docker environment by installing an starting all [services locally](./docs/nodocker.md).

## Working with docker

The easiest way to start developing is to work with docker.
Here is a quick setup; there are more detailed instructions in [here](./docs/development.md).

After you have installed docker, run the following command to spin up ganache (with the migrated contracts), the graph-node server:
```sh
docker-compose up graph-node
```

Now, in a separate terminal run the following command to run alchemy:
```sh
npm run start
```

At this point you should be able to access alchemy on http://127.0.0.1:3000.

See [working with docker](./docs/docker.md) for details and troubleshooting.

## Interacting with your test instance using MetaMask

1. Install and enable [MetaMask extension](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en) in Chrome
1. Click on the MetaMask extension icon in the toolbar and log in
1. Click on the avatar icon in the top right, and choose "Import Account"
1. Choose "Private Key" and paste the string `0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d` and click "Import"
1. Give it a name like "Alchemy Test Account" so you won't get confused later
1. If you need more than one test account you can also import these private keys: `0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1`, `0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c` and `0x646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913`. Make sure to give them all differnent names.
1. Make sure that Metamask is connected to `127.0.0.1:8545` (choose from the "Networks" picklist in Metamask)
1. Go to http://127.0.0.1:3000 to load Alchemy

## Adding custom landing page content for your DAO

Just submit a PR to https://github.com/daostack/alchemy with your desired changes in src/customDaoInfo.tsx.  You may supply plain text or HTML inside of parentheses.  The HTML may contain React.js components, most notably `Link` which will cleanly navigate to pages within Alchemy.
