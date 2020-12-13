require('ts-node').register({
  project: './test/integration/tsconfig.json',
  transpileOnly: true,
});
module.exports = require('./wdio.conf.ts');
