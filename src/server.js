const path = require('path');
const express = require('express');

module.exports = {
  app: function () {
    const app = express();
    const indexPath = path.join(__dirname, '../dist/index.html');
    const distPath = express.static(path.join(__dirname, '../dist'));

    app.use('/', distPath);
    app.get('/', function (_, res) { res.sendFile(indexPath) });

    return app
  }
}