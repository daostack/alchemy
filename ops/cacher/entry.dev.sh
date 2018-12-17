#!/bin/bash
set -e

echo "Waiting for $IPFS_URL and ${ETH_PROVIDER#*://}"
bash /ops/wait-for.sh -t 60 $IPFS_URL 2> /dev/null
bash /ops/wait-for.sh -t 60 ${ETH_PROVIDER#*://} 2> /dev/null

redis-server &

webpack --watch --config ops/cacher/webpack.dev.js &

exec nodemon --legacy-watch --exitcrash --watch build --watch node_modules/@daostack/arc.js/migrated_contracts build/cacher.dev.js
