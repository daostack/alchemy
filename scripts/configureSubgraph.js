const path = require('path')

async function configureSubgraph(options) {
  // const subgraphConfigure = require('@daostack/subgraph/ops/index.js').configure
  subgraphRepo = options.subgraphRepo || require.resolve('@doastack/subgraph')
  daoAddressesFile = options.daoAddressesFile || `${__dirname}/../config/migration.json`
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
  // console.log(`Output written to ${config.outputDir}`)
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
