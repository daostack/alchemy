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
wait_for ethprovider

redis-server &

webpack --watch --config ops/cacher/webpack.dev.js &

exec nodemon --legacy-watch --exitcrash --watch build --watch node_modules/@daostack/arc.js/migrated_contracts build/cacher.dev.js
