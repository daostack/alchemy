const redis = require('redis');
const updateCache = require('../dist/bg_cache_worker').default;

setInterval(updateCache, 30000);