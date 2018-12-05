const path = require('path')
const configureSubgraph = require('./configureSubgraph').configureSubgraph
const deploySubgraph = require('./deploySubgraph').deploySubgraph
const deployDaoStack = require('./deployDaoStack').deployDaoStack

async function main() {
  const provider = 'http://localhost:8545'
  // const subgraphRepo = require.resolve('@daostack/subgraph')
  const subgraphRepo = path.resolve('./node_modules/@daostack/subgraph')
  console.log(`Deploying Daostack contracts to ${provider}`)
  let { options, migrationResult } = await deployDaoStack({provider})
  console.log(`Deployed Daostack contracts, information written to ${options.output}`)

  console.log('Creating config files for subgraph')
  await configureSubgraph({
    subgraphRepo,
    daoAddressesFile: `${__dirname}/../config/migration.json`
  })
  console.log('Deploying subgraph configuration')
  const cwd = subgraphRepo
  const deploymentResult = await deploySubgraph(cwd)
  // deploymentResult[0] is the status code
  // but it is not very helpful, because it returns 0 also on some errors
  // console.log(deploymentResult[0])
  const msg = deploymentResult[1]
  if (msg.toLowerCase().indexOf('error') > 0) {
    console.log(msg)
    throw Error(msg)
  } else {
    console.log(msg)
    console.log(`All done!`)
  }
}

main().catch(error => {
  console.log(error);
});
