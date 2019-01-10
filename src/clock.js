const redis = require('redis');
const updateCache = require('../dist/bg_cache_worker').default;

// Update cache once immediately when the dyno starts
updateCache();

// Every minute check the blockchain for updates
setInterval(updateCache, 60000);