const redis = require('redis');
const updateCache = require('./bg_cache_worker').default;

setInterval(updateCache, 30000);