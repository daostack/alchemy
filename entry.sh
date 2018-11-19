#!/bin/bash

set -e

# wait for required containers
/wait

# TODO: ganache shoudl run in a separate container
# this is a quick hack to ahve ganache running and deploy the contracts we need
 # nohup npm run ganacheDb &
nohup npm explore ganache-cli -- npm start --  -h 0.0.0.0 --networkId 1512051714758 --mnemonic "behave pipe turkey animal voyage dial relief menu blush match jeans general" &

npm run migrate-ganache
npm run start-docker
