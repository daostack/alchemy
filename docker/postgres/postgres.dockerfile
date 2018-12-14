FROM postgres
COPY ./docker-entrypoint-initdb.d/init-db.sh /docker-entrypoint-initdb.d/
