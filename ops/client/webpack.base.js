const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

const allConfig = require('../config.json');

const devMode = process.env.NODE_ENV !== 'production'
const config = devMode ? allConfig.development : allConfig.production;
const basePath = process.cwd();

module.exports = {

  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],

    alias: {
      actions: path.resolve(basePath, 'src/actions'),
      components: path.resolve(basePath, 'src/components'),
      constants: path.resolve(basePath, 'src/constants'),
      layouts: path.resolve(basePath, 'src/layouts'),
      lib: path.resolve(basePath, 'src/lib'),
      reducers: path.resolve(basePath, 'src/reducers'),
      selectors: path.resolve(basePath, 'src/selectors'),
      schemas: path.resolve(basePath, 'src/schemas'),
      src: path.resolve(basePath, 'src')
    },
  },

  stats: {
    warnings: false,
  },

  module: {
    rules: [
      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader"
      },

      // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
      {
        test: /\.tsx?$/,
        loader: ['react-hot-loader/webpack', "awesome-typescript-loader" ],
        exclude: [/node_modules/]
      },

      // CSS handling
      {
        test: /\.css$/,
        include: /client/,
        use: [
          'style-loader',
          { // translates CSS into CommonJS (css-loader) and automatically generates TypeScript types
            loader: 'typings-for-css-modules-loader',
            options: {
              camelCase: true,
              localIdentName: '[name]__[local]___[hash:base64:5]',
              minimize: devMode ? false : true,
              modules: true,
              namedExport: true,
              sourceMap: true
            }
          },
        ],
      },

      // Images & fonts
      {
        test: /\.(png|jpg|gif|mp4|ogg|svg|woff|woff2|ttf|eot|ico)$/,
        loader: 'url-loader',
        options: {
          limit: 10000 // For assets smaller than 10k inline them as data urls, otherwise use regular file loader
        }
      },

    ]
  },

  plugins: [
    // do not emit compiled assets that include errors
    new webpack.NoEmitOnErrorsPlugin(),
    new HtmlWebpackPlugin({
      template: 'src/index.html'
    }),
    new CopyWebpackPlugin([
      { from: 'src/assets', to: 'assets' }
    ]),
  ],
};
