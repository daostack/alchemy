const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');
const merge = require('webpack-merge');
const config = require('../config.json').production;

const baseConfig = require('./webpack.base.js');
const basePath = process.cwd();

module.exports = merge(baseConfig, {
  mode: "production",

  entry: [
    path.resolve(basePath, 'src/index.tsx'),
  ],

  output: {
    filename: "client.prod.js",
    path: path.resolve(basePath, 'build/public'),
    publicPath: '/'
  },

  devtool: 'nosources-source-map',

  module: {
    rules: [
      {
        test: /\.scss$/,
          use: [
          MiniCssExtractPlugin.loader,
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
      },
    ],
  },

  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        test: /\.js($|\?)/i,
        sourceMap: false,
        extractComments: true,
        parallel: true,
        uglifyOptions: {
          ecma: 6,
          mangle: {
            reserved: ['BigNumber'],
          }      
        }
      }),
      new OptimizeCSSAssetsPlugin({})
    ]
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[hash].css',
      chunkFilename: '[id].[hash].css',
    }),
    new webpack.DefinePlugin({
      'VERSION': JSON.stringify(require('../../package.json').version),
      'process.env': {
        'NODE_ENV': JSON.stringify('production'),
        'API_URL': JSON.stringify(config.API_URL),
        'CACHE_SERVER_URL': JSON.stringify(config.CACHE_SERVER_URL),
        'arcjs_network': JSON.stringify(config.arcjs_network),
        'arcjs_providerPort': JSON.stringify(config.arcjs_providerPort),
        'arcjs_providerUrl': JSON.stringify(config.arcjs_providerUrl),
      }
    })
  ],
});
