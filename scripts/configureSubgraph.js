const path = require('path')

/**
 * Take the output of the @doastack/migration repo and combine it into a subgraph.yaml
 * that can be deployed
 * Usage:
 *  configureSubgraph({ aoAddressesFile: 'path/to/config/migration.json'})
 */

async function configureSubgraph(options) {
  // path to the source file
  daoAddressesFile = options.daoAddressesFile || `${__dirname}/../config/migration.json`
  // path to the subgraph repository
  subgraphRepo = options.subgraphRepo || require.resolve('@doastack/subgraph')
  const subgraphConfigure = require(`${subgraphRepo}/ops/index.js`).configure
  const migrationAddresses = require(daoAddressesFile).private
  if (migrationAddresses === undefined) {
    throw Error(`No address from migration found. Did you run "setupenv.js"? Is here a file in ${migrationAddressesFile}?`)
  }

  const addresses = {
    "UController": migrationAddresses.base.UController,
    "Reputation": migrationAddresses.dao.NativeReputation,
    "DAOToken": migrationAddresses.base.DAOToken,
    // "GPToken": migrationAddresses,
    "ContributionReward": migrationAddresses.base.ContributionReward,
    "GenesisProtocol": migrationAddresses.base.GenesisProtocol,
    "Avatar": migrationAddresses.dao.Avatar
  }
  const config = await subgraphConfigure({
    env: 'development',
    development: { addresses },
    // outputDir: path.resolve(`${__dirname}/../config`)
  })
}

async function main() {
  configureSubgraph()
}

if (require.main === module) {
  main()
} else {
  module.exports = {
    configureSubgraph
  }
}
