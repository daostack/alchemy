const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const merge = require('webpack-merge');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');

const baseConfig = require('./webpack.base.config.js');

const extractSass = new ExtractTextPlugin({
  filename: "[name].[contenthash].css"
});

network = process.env.network || 'kovan';

module.exports = merge(baseConfig, {
  devtool: 'nosources-source-map',

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
          use: [
            {
              loader: "css-loader",
              options: {
                minimize: true,
                modules: true, // Use CSS Modules
                localIdentName: '[name]__[local]___[hash:base64:5]',
                importLoaders: 2
              }
            },
            {
              loader: "sass-loader"
            },
            {
              loader: 'sass-resources-loader',
              options: {
                resources: ['./src/assets/styles/global-variables.scss']
              },
            },
          ],
        }),
      },
    ],
  },

  plugins: [
    extractSass,
    new webpack.DefinePlugin({
      'process.env': {
        'network': JSON.stringify(network),
        'NODE_ENV': JSON.stringify('production')
      },
    }),
    new HtmlWebpackPlugin({
      template: 'src/index.html'
    }),
    new CopyWebpackPlugin([
      { from: 'src/assets', to: 'assets' }
    ])
    // new UglifyJsPlugin({
    //   test: /\.js($|\?)/i,
    //   sourceMap: true,
    //   extractComments: true,
    //   parallel: true,
    //   uglifyOptions: {
    //     ecma: 6
    //   }
    // })
  ],
});
