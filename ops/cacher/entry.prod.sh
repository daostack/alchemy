#!/bin/bash

function wait_for {
  target=$1
  echo "Waiting for $target to wake up..."
  while true
  do
    ping -c1 -w1 $target > /dev/null 2> /dev/null
    if [[ "$?" == "0" ]]
    then sleep 3 && break
    else sleep 3 && echo "Waiting for $target to wake up..."
    fi
  done
}

wait_for ipfs

live_cache=/app/cache/initialArcState-live.json
another_live_cache=https://s3-us-west-2.amazonaws.com/daostack-alchemy-staging/initialArcState-live.json

if [[ ! -f "$live_cache" ]]
then curl $another_live_cache -o $live_cache || true
fi
redis-server &
exec node cacher.js
