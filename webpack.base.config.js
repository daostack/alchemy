const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const ENV = process.env.NODE_ENV || "development";
const isProd = ENV === "production";
const isDev = ENV === "development";
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const basePath = process.cwd();

const resolve = (pat) => path.resolve(basePath, pat)

module.exports = {
  devtool: "eval",

  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],

    alias: {
      arc: resolve("src/arc"),
      actions: resolve("src/actions"),
      components: resolve("src/components"),
      constants: resolve("src/constants"),
      data: resolve("data"),
      genericPluginRegistry: resolve("src/genericPluginRegistry"),
      crxRegistry: resolve("src/crxRegistry"),
      layouts: resolve("src/layouts"),
      lib: resolve("src/lib"),
      pages: resolve("src/pages"),
      reducers: resolve("src/reducers"),
      selectors: resolve("src/selectors"),
      src: resolve("src"),
      "ipfs-api": "ipfs-api/dist",
      "bn.js": "bn.js/lib/bn.js"
    }
  },

  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
      {
        test: /\.tsx?$/,
        loader: ["react-hot-loader/webpack", "awesome-typescript-loader"],
        exclude: [/node_modules/, /\.spec\.ts$/]
      },

      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader",
        exclude: [
          resolve("node_modules/apollo-cache-inmemory"),
          resolve("node_modules/apollo-client"),
          resolve("node_modules/apollo-link"),
          resolve("node_modules/apollo-link-http"),
          resolve("node_modules/apollo-link-ws"),
          resolve("node_modules/ethereumjs-common"),
          resolve("node_modules/ethereumjs-tx"),
          resolve("node_modules/ethereumjs-util"),
          resolve("node_modules/graphql-request"),
          resolve("node_modules/https-did-resolver"),
          resolve("node_modules/rlp"),
          resolve("node_modules/subscriptions-transport-ws"),
          resolve("node_modules/xhr2-cookies"),
          resolve("node_modules/zen-observable-ts"),
          resolve("node_modules/@dorgtech")
        ]
      },

      // This handle the CSS coming from dao creator
      {
        test: /\.css$/,
        include: [
          resolve("node_modules/@fortawesome/fontawesome-free/css/all.min.css"),
          resolve("node_modules/mdbreact/dist/css/mdb.css"),
          resolve("node_modules/@dorgtech/daocreator-ui-experimental/dist")
        ],
        use: [MiniCssExtractPlugin.loader, "css-loader"]
      },

      // CSS handling
      {
        test: /\.css$/,
        include: /client/,
        exclude: /node_modules/,
        use: [
          "style-loader",
          {
            // translates CSS into CommonJS (css-loader) and automatically generates TypeScript types
            loader: "typings-for-css-modules-loader",
            options: {
              camelCase: true,
              localIdentName: "[name]__[local]___[hash:base64:5]",
              minimize: isProd,
              modules: true,
              namedExport: true,
              sourceMap: true
            }
          }
        ]
      },

      // Images & fonts
      {
        test: /\.(png|jpg|gif|mp4|ogg|svg|woff|woff2|ttf|eot|ico)$/,
        loader: "url-loader",
        options: {
          limit: 10000 // For assets smaller than 10k inline them as data urls, otherwise use regular file loader
        }
      }
    ]
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: "src/index.html"
    }),
    new webpack.DefinePlugin({
      PACKAGE_VERSION: JSON.stringify(require("./package.json").version)
    }),
    new webpack.EnvironmentPlugin({
      ALCHEMY_URL_V1_XDAI: "https://v1.xdai.alchemy.do",
      ALCHEMY_URL_V1_MAINNET: "https://v1.alchemy.do",
      ALCHEMY_URL_V2_XDAI: "https://xdai.alchemy.do",
      ALCHEMY_URL_V2_MAINNET: "https://alchemy.do",
    }),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new MiniCssExtractPlugin()
  ],
  node: {
    fs: "empty",
    net: "empty",
    tls: "empty",
    child_process: "empty"
  }
};
