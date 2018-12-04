const path = require('path')
async function configureSubgraph() {
  // const subgraphConfigure = require('@daostack/subgraph/ops/index.js').configure
  const subgraphConfigure = require('../../subgraph/ops/index.js').configure
  const migrationAddressesFile = `${__dirname}/../config/migration.json`
  const migrationAddresses = require(migrationAddressesFile).private
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
    subgraphOutputFile: path.resolve(`${__dirname}/../config/subgraph.yaml`)
  })
  console.log(`Output written to ${config.subgraphOutputFile}`)
}

async function main() {
  configureSubgraph()
}

main()
