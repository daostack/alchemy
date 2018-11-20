#!/bin/bash

set -e

# wait for required containers
/wait

# TODO: ganache runs in a separate container and we should use that process
# this is a quick hack to  play nice with arc.js
echo "starting ganache..."
npm explore ganache-cli -- npm start --  -h 0.0.0.0 --networkId 1512051714758 --quiet --mnemonic "behave pipe turkey animal voyage dial relief menu blush match jeans general"   > /dev/null &
echo "ganache started"

echo "deploying contracts..."
npm run migrate-ganache > /dev/null
echo "deployed contracts"

npm run start-docker
