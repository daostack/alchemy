## Environment variables

Alchemy uses a number of environment variables to determine how the app is built and what services it connects to

These are:
```
    API_URL: "http://127.0.0.1:3001" // connection to alchemy server
    BASE_URL: "http://localhost:3000"
    DISQUS_SITE: "daostack-alchemy"
    NODE_ENV: "development"
    S3_BUCKET: "daostack-alchemy"
```


## Optimiziation and profiling

The following command will start the application on localhost:3000 with settings suitable for profiling.

* `npm run start-dev-profiling`

This will start the development server in the following way:
  - in dev mode on localhost:3000 (so we have maps and debugging enabled)
  - connected to main net
  - getting initial data from main net
  - connected to public data server
