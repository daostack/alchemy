const webpack = require('webpack');
const path = require('path');

const ENV = process.env.NODE_ENV || 'development';
const isProd = ENV === 'production';
const isDev = ENV === 'development';

module.exports = {
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

  output: {
    filename: "bundle.js",

    path: __dirname + "/dist/",

    // necessary for HMR to know where to load the hot update chunks
    publicPath: '/dist/'
  },

  // Enable sourcemaps for debugging webpack's output.
  devtool: isProd ? 'source-map' : 'cheap-module-eval-source-map',

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
      }
    ]
  },

  plugins: (function () {
    const plugins = [
      // do not emit compiled assets that include errors
      new webpack.NoEmitOnErrorsPlugin()
    ];

    if (isDev) {
      // enable HMR globally
      plugins.push(new webpack.HotModuleReplacementPlugin());

      // Prints more readable module names in the browser console on HMR updates
      plugins.push(new webpack.NamedModulesPlugin());
    }

    return plugins;
  }()),

  devServer: {
    contentBase: path.resolve(__dirname, 'src'),
    hot: isDev,
    publicPath: '/',
    historyApiFallback: true,
    port: 3000
  }
};