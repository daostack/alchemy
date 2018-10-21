const path = require('path');
const merge = require('webpack-merge');
const baseConfig = require('./webpack.base.js');
const basePath = process.cwd();

module.exports = merge(baseConfig, {
  mode: "development",
  output: {
    path: path.join(basePath, 'build'),
    filename: 'cacher.dev.js',
  },
});
