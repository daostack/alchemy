#!/bin/bash

set -e

# wait for required containers
/wait

# /wait-for-it.sh postgres:5432
# update the database
node ./server/create-lb-tables.js`
node ./server/migrate.js`
npm run start
