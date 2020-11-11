const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');

const baseConfig = require('./webpack.base.config.js');

// tslint:disable-next-line:no-var-requires
require('dotenv').config();

module.exports = merge(baseConfig, {
  mode: 'development',

  devtool: 'eval-source-map',

  devServer: {
    contentBase: path.resolve(__dirname, 'src'),
    hot: true,
    publicPath: '/',
    historyApiFallback: true,
    port: 3000,
    host: '0.0.0.0'
  },

  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, 'dist'),
    // necessary for HMR to know where to load the hot update chunks
    publicPath: '/'
  },

  entry: [
    // activate HMR for React
    'react-hot-loader/patch',

    // bundle the client for webpack-dev-server
    // and connect to the provided endpoint
    'webpack-dev-server/client?http://127.0.0.1:3000',

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
        use: [
          { // creates style nodes from JS strings
            loader: "style-loader"
          },
          { // translates CSS into CommonJS (css-loader) and automatically generates TypeScript types
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
          { // compiles Sass to CSS
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

    new webpack.EnvironmentPlugin({
      NETWORK: "ganache",
      NODE_ENV: "development",
      SHOW_ALL_DAOS: "true",
      BASE_URL: "http://127.0.0.1:3000",
      DISQUS_SITE:'daostack-alchemy',
      ARC_GRAPHQLHTTPPROVIDER: "",
      ARC_GRAPHQLWSPROVIDER : "",
      ARC_WEB3PROVIDER : "",
      ARC_WEB3PROVIDERREAD : "",
      ARC_IPFSPROVIDER: "",
      ARC_IPFSPROVIDER_HOST : "",
      ARC_IPFSPROVIDER_PORT : "",
      ARC_IPFSPROVIDER_PROTOCOL : "",
      ARC_IPFSPROVIDER_API_PATH : "",
      INFURA_ID : "",
      ETHERSCAN_API_KEY : "",
      MIXPANEL_TOKEN: "eac39430f2d26472411099a0407ad610",
    })
  ]
});
