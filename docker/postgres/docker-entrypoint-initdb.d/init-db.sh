#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	CREATE USER alchemist PASSWORD 'njksdfyuieyui34y';
	CREATE DATABASE alchemy;
	GRANT ALL PRIVILEGES ON DATABASE alchemy TO alchemist;
EOSQL
