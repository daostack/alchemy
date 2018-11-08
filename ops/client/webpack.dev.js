const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const config = require('../config.json').development;

const baseConfig = require('./webpack.base.js');
const basePath = process.cwd();

module.exports = merge(baseConfig, {
  mode: "development",

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
    path.resolve(basePath, 'src/index.tsx'),
  ],

  output: {
    filename: "client.dev.js",
    path: path.resolve(basePath, 'build'),
    publicPath: '/'
  },

  devtool: 'cheap-module-eval-source-map',

  devServer: {
    host: '0.0.0.0',
    port: 3000,
    hot: true,
    contentBase: path.resolve(__dirname, '../build'),
    publicPath: '/',
    historyApiFallback: true,
    watchOptions: {
      poll: 1000,
      ignored: /node_modules\/[^@]/,
    },
  },

  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          {
            loader: "style-loader"
          },
          {
            loader: 'typings-for-css-modules-loader',
            options: {
              camelCase: true,
              modules: true,
              namedExport: true,
              localIdentName: '[name]__[local]___[hash:base64:5]',
              importLoaders: 2,
              sourceMap: true
            }
          },
          {
            loader: "sass-loader",
            options: {
              sourceMap: true
            }
          },
          { // Load global scss files in every other scss file without an @import needed
            loader: 'sass-resources-loader',
            options: {
              resources: ['./src/assets/styles/global-variables.scss']
            },
          },
        ]
      }
    ],
  },

  plugins: [
    // enable HMR globally
    new webpack.HotModuleReplacementPlugin(),
    // Prints more readable module names in the browser console on HMR updates
    new webpack.NamedModulesPlugin(),
    new webpack.DefinePlugin({
      'VERSION': JSON.stringify(require('../../package.json').version),
      'process.env': {
        'NODE_ENV': JSON.stringify('development'),
        'API_URL': JSON.stringify(config.API_URL),
        'CACHE_SERVER_URL': JSON.stringify(config.CACHE_SERVER_URL),
        'DISQUS_SITE': JSON.stringify(process.env.DISQUS_SITE || 'daostack-alchemy')
        'arcjs_network': JSON.stringify(config.arcjs_network),
        'arcjs_providerPort': JSON.stringify(config.arcjs_providerPort),
        'arcjs_providerUrl': JSON.stringify(config.arcjs_providerUrl),
      }
    })
  ]
});
