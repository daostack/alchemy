const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');

const baseConfig = require('./webpack.base.config.js');

module.exports = merge(baseConfig, {
  devtool: 'cheap-module-eval-source-map',

  devServer: {
    contentBase: path.resolve(__dirname, 'src'),
    hot: true,
    publicPath: '/',
    historyApiFallback: true,
    port: 3000
  },

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
        use: [{
          loader: "style-loader" // creates style nodes from JS strings
        }, {
          loader: "css-loader", // translates CSS into CommonJS
          options: {
            modules: true, // Use CSS Modules
            localIdentName: '[name]__[local]___[hash:base64:5]',
            importLoaders: 1
          }
        }, {
          loader: "sass-loader" // compiles Sass to CSS
        }]
      }
    ],
  },

  plugins: [
    // enable HMR globally
    new webpack.HotModuleReplacementPlugin(),

    // Prints more readable module names in the browser console on HMR updates
    new webpack.NamedModulesPlugin()
  ]
});
