const updateCache = require('./bg_cache_worker').default;
const cors = require('cors');
const path = require('path');
const express = require('express');
const port = (process.env.PORT || 3002)

// Update cache once immediately when the dyno starts
updateCache();

// Every minute check the blockchain for updates
setInterval(updateCache, 60000);

// Serve the cache to clients
const app = express();
app.use(cors());
app.use('/', (req, res, next) => {
  console.log(`==> ${req.method} ${req.baseUrl}${req.path}`)
  next();
});
app.use('/', express.static('/app/cache'));
app.listen(port)
console.log(`Listening at http://localhost:${port}`)
