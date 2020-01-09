## Environment variables

Alchemy uses a number of environment variables to determine how the app is built and what services it connects to

These are:
```
    BASE_URL: "http://127.0.0.1:3000"
    DISQUS_SITE: "daostack-alchemy"
    NODE_ENV: "development"
```


## Optimiziation and profiling

The following command will start the application on 127.0.0.1:3000 with settings suitable for profiling.

* `npm run start-dev-profiling`

This will start the development server in the following way:
  - in dev mode on 127.0.0.1:3000 (so we have maps and debugging enabled)
  - connected to main net
  - getting initial data from main net
  - connected to public data server

Now visit http://127.0.0.1:3000/ or http://127.0.0.1:3000/dao/0xa3f5411cfc9eee0dd108bf0d07433b6dd99037f1 and start profiling

For _very_ rough statistics, open devTools -> Network and look at the line that says something like "64 requests; XMB transfered; etc." The "finish" time (after the page has rendered) gives a rough indication about when the page is rendered...


## Subscriptions and queries

For the performance of the app, it is important that we limit the amount of queries and subscriptions that alchemy creates when loading a page.
