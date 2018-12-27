#!/bin/bash

set -e

# wait for required containers
/wait

# update the database
cd /alchemy-server
node ./server/create-lb-tables.js
node ./server/migrate.js

npm run start
