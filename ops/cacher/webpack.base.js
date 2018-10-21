const path = require('path');
const nodeExternals = require('webpack-node-externals');
const basePath = process.cwd();

module.exports = {
  target: 'node',
  externals: [nodeExternals({ modulesFromFile: true })],

  entry: './src/cacher.js',

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
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

  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
      {
        test: /\.tsx?$/,
        loader: ['react-hot-loader/webpack', "awesome-typescript-loader" ],
        exclude: [/node_modules/]
      },
    ],
  },

  stats: {
    warnings: false,
  },
};
