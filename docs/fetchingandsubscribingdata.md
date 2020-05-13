# Fetching data with apollo and subscribing to updates

Most of the data that we are showing in alchemy comes from graphql queries.

In general the process of fetching the data of a query and subscribing to updates is as follows:

1. Try to fetch the data from the local cache
2. If the data is not in the cache, fetch the data from the server (and fill the cache)
3. Subscribe to cache updates (if the data of the cache changes, then update the data)
4. [optional] Subscribe to server updates of the data (i.e. open a websocket and start a server-side process that will update the cache when data on the server changes)

Executing these four steps for each React component is quite expensive (just think of showing 100 proposals and executing 100 different queries and subscriptions to get the votes to render a vote component). The cost here lies in steps 2. (sending many queries over the network and wait for a response makes the application slow) and 4 (keeping 100s of subscriptions open for 100s of clients puts a considerable load on the server)

So the approach we are taking in Alchemy is the following.

*to avoid the cost of step 2.:*
Fetch the data that is used by many subcomponents in a single query, before those components are rendered. When those subcomponents are rendered, they will be able to get their data directly  from the cache, and so will avoid a server request in step 2. An example of that pattern is found in the `DaoHistoryPage.tsx`

*To avoid the cost of step 4:*
The line `arcSettings.graphqlSubscribeToQueries = false;` overrides arc.js' default behavior to open a subscription for each query. So, by default, step 4 is skipped. Instead, we insert, in strategic places, subscriptions to relatively big queries, that will update the cache only for the data that we need.
An example of this pattern is in `PluginProposalsPage.tsx`
