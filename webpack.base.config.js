const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const ENV = process.env.NODE_ENV || 'development';
const isProd = ENV === 'production';
const isDev = ENV === 'development';

const basePath = process.cwd();

module.exports = {
  devtool: 'eval',

  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],

    alias: {
      arc: path.resolve(basePath, 'src/arc'),
      actions: path.resolve(basePath, 'src/actions'),
      components: path.resolve(basePath, 'src/components'),
      constants: path.resolve(basePath, 'src/constants'),
      layouts: path.resolve(basePath, 'src/layouts'),
      lib: path.resolve(basePath, 'src/lib'),
      reducers: path.resolve(basePath, 'src/reducers'),
      selectors: path.resolve(basePath, 'src/selectors'),
      schemas: path.resolve(basePath, 'src/schemas'),
      src: path.resolve(basePath, 'src'),
      'ipfs-api': 'ipfs-api/dist',
      'ipfs-http-client': 'ipfs-http-client/dist',
      'bn.js': 'bn.js/lib/bn.js'
    },
  },

  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
      {
        test: /\.tsx?$/,
        loader: ['react-hot-loader/webpack', "awesome-typescript-loader"],
        exclude: [/node_modules/, /\.spec\.ts$/]
      },

      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      // TODO; does this end up in the budnle? If so, we may only want to do this in dev
      {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader",
        exclude: [
          /node_modules\/apollo-cache-inmemory/,
          /node_modules\/apollo-client/,
          /node_modules\/apollo-link/,
          /node_modules\/apollo-link-http/,
          /node_modules\/apollo-link-ws/,
          /node_modules\/ethereumjs-util/,
          /node_modules\/xhr2-cookies/,
          /node_modules\/rlp/,
          /node_modules\/subscriptions-transport-ws/,
          /node_modules\/zen-observable-ts/,
        ]
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
              minimize: isProd,
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
    new HtmlWebpackPlugin({
      template: 'src/index.html'
    }),
    new webpack.DefinePlugin({
      'VERSION': JSON.stringify(require('./package.json').version),
      TOKENS: {
        "GEN": JSON.stringify("0x543ff227f64aa17ea132bf9886cab5db55dcaddf"),
        "DAI": JSON.stringify("0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359"),
        "GUSD": JSON.stringify("0x056fd409e1d7a124bd7017459dfea2f387b6d5cd"),
        "PAX": JSON.stringify("0x8e870d67f660d95d5be530380d0ec0bd388289e1"),
        "TUSD": JSON.stringify("0x0000000000085d4780B73119b644AE5ecd22b376"),
        "USDC": JSON.stringify("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
        "USDT": JSON.stringify("0xdac17f958d2ee523a2206206994597c13d831ec7"),
        "KNC": JSON.stringify("0xdd974D5C2e2928deA5F71b9825b8b646686BD200")
      }
    }),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
  ],
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  }
};
