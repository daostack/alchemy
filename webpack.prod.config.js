const path = require('path');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const merge = require('webpack-merge');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');

const baseConfig = require('./webpack.base.config.js');

const extractSass = new ExtractTextPlugin({
  filename: "[name].[contenthash].css"
});

module.exports = merge(baseConfig, {
  devtool: 'nosources-source-map',

  output: {
    filename: "bundle-[hash:8].js",
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/'
  },

  entry: [
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
        'NODE_ENV': JSON.stringify("production"),
        'arcjs_network': JSON.stringify(process.env.arcjs_network || "live"),
        'S3_BUCKET': JSON.stringify(process.env.S3_BUCKET || "daostack-alchemy"),
        'API_URL': JSON.stringify(process.env.API_URL || "https://daostack-alchemy.herokuapp.com"),
        'BASE_URL': JSON.stringify(process.env.BASE_URL || "https://alchemy.daostack.io")
      },
    }),
    new CopyWebpackPlugin([
      { from: 'src/assets', to: 'assets' }
    ]),
    new UglifyJsPlugin({
      test: /\.js($|\?)/i,
      sourceMap: false,
      extractComments: true,
      parallel: true,
      uglifyOptions: {
        ecma: 6
      }
    })
  ],
});
