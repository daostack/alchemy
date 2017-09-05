const path = require('path');
const webpack = require('webpack');

const ENV = process.env.NODE_ENV || 'development';
const isProd = ENV === 'production';
const isDev = ENV === 'development';

module.exports = {

  output: {
    filename: "bundle.js",

    path: __dirname + "/dist/",

    // necessary for HMR to know where to load the hot update chunks
    publicPath: '/dist/'
  },

  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: [".ts", ".tsx", ".js", ".json"]
  },

  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
      {
        test: /\.tsx?$/,
        loader: ['react-hot-loader/webpack', "awesome-typescript-loader" ]
      },

      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader"
      },

      // CSS handling
      {
        test: /\.css$/,
        include: /client/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              minimize: isProd,
              modules: true, // Use CSS Modules
              localIdentName: '[name]__[local]___[hash:base64:5]'
            }
          }
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
    new webpack.NoEmitOnErrorsPlugin()
  ],
};