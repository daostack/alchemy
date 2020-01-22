const path = require('path');

const basePath = process.cwd();

module.exports = ({ config }) => {
  config.module.rules.push({
    test: /\.(ts|tsx)$/,
    use: [
      {
        loader: require.resolve('awesome-typescript-loader'),
      },
      // Optional
      {
        loader: require.resolve('react-docgen-typescript-loader'),
      },
    ],
  });
  config.resolve.extensions.push('.ts', '.tsx');
  config.resolve.alias = {
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
  };
  return config;
};