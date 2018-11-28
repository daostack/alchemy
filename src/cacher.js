const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const path = require('path');
const port = (process.env.PORT || 3002)
const updateCache = require('./bg_cache_worker').default;

// Update cache once immediately when the dyno starts
updateCache();

// Every minute check the blockchain for updates
if (process.env.NODE_ENV === 'production') setInterval(updateCache, 60000);

// Serve the cache to clients
const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use((req, res, next) => {
  console.log(`=> ${req.method}: ${req.path} -- ${JSON.stringify(req.body, null, 2)}`)
  next();
});

app.use('/', express.static('/app/cache'));
app.listen(port)
console.log(`Listening at http://localhost:${port}`)
