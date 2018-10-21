#!/bin/bash

function wait_for {
  target=$1;
  echo "Waiting for $target to wake up."
  while true; do
    ping -c1 -w1 $target > /dev/null 2> /dev/null
    if [[ "$?" == "0" ]]; then
      echo "Good morning!";echo;
      break
    fi
    echo "Waiting for $target to wake up."
    sleep 3
  done
}

wait_for server

live_cache=/app/cache/initialArcState-live.json
another_live_cache=https://s3-us-west-2.amazonaws.com/daostack-alchemy-staging/initialArcState-live.json

if [[ ! -f "$live_cache" ]]
then
  curl $another_live_cache -o $live_cache
fi
redis-server &
exec node cacher.js
