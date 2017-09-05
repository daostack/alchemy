const ExtractTextPlugin = require('extract-text-webpack-plugin');
const merge = require('webpack-merge');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');

const baseConfig = require('./webpack.base.config.js');

const extractSass = new ExtractTextPlugin({
  filename: "[name].[contenthash].css"
});

module.exports = merge(baseConfig, {
  devtool: 'source-map',

  entry: [
    // activate HMR for React
    'react-hot-loader/patch',

    // bundle the client for webpack-dev-server
    // and connect to the provided endpoint
    'webpack-dev-server/client?http://localhost:3000',

    // bundle the client for hot reloading
    // only- means to only hot reload for successful updates
    'webpack/hot/only-dev-server',

    // the entry point of our app
    __dirname + '/src/index.tsx',
  ],

  module: {
    rules: [
      {
        test: /\.scss$/,
        use: extractSass.extract({
          use: [{
            loader: "css-loader",
            options: {
              minimize: true,
              modules: true, // Use CSS Modules
              localIdentName: '[name]__[local]___[hash:base64:5]',
              importLoaders: 1
            }
          }, {
            loader: "sass-loader"
          }],
        }),
      },
    ],
  },

  plugins: [
    extractSass,

    // Minify JS
    // new UglifyJsPlugin({
    //   sourceMap: false,
    //   compress: true,
    // }),
  ],
});
