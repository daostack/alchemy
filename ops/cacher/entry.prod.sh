#!/bin/bash
set -e

echo "Waiting for $IPFS_URL"
bash /ops/wait-for.sh -t 60 $IPFS_URL 2> /dev/null

live_cache=cache/initialArcState-live.json
another_live_cache=https://s3-us-west-2.amazonaws.com/daostack-alchemy-staging/initialArcState-live.json

if [[ ! -f "$live_cache" ]]
then curl $another_live_cache -o $live_cache || true
fi
redis-server &
exec node cacher.js
