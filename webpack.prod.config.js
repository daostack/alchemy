const path = require('path');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const merge = require('webpack-merge');
const webpack = require('webpack');

const baseConfig = require('./webpack.base.config.js');

const config = merge(baseConfig, {
  mode: 'production',

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

  optimization: {
    minimizer: [
      new OptimizeCSSAssetsPlugin({})
    ]
  },

  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader',
          {
            loader: 'sass-resources-loader',
            options: {
              resources: ['./src/assets/styles/global-variables.scss']
            }
          }
        ],
      },
    ],
  },

  plugins: [
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: "[name].[hash].css",
      chunkFilename: "[id].[hash].css"
    }),
    new webpack.DefinePlugin({
      'process.env': {
        'API_URL': JSON.stringify(process.env.API_URL || "https://daostack-alchemy.herokuapp.com"),
        'BASE_URL': JSON.stringify(process.env.BASE_URL || "https://alchemy.daostack.io"),
        'DISQUS_SITE': JSON.stringify(process.env.DISQUS_SITE || 'daostack-alchemy'),
        'S3_BUCKET': JSON.stringify(process.env.S3_BUCKET || "daostack-alchemy"),
      },
    }),
    new CopyWebpackPlugin([
      { from: 'src/assets', to: 'assets' }
    ])
  ],
});

if (process.env.ANALYZE) {
  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
  config.plugins.push(new BundleAnalyzerPlugin())
}

module.exports = config
