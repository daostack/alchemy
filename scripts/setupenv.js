const DAOstackMigration = require('@daostack/migration');
const path = require('path')
const spawn = require('spawn-command')
const fs = require('fs')
// ganache-core object with already migrated contracts
// options are as specified in https://github.com/trufflesuite/ganache-cli#library
// DAOstackMigration.Ganache.server(..);
// DAOstackMigration.Ganache.provider(..);
// migration result object for ganache
async function deployDaoStack() {
  console.log(DAOstackMigration.migration('private'))

  const options = {
    // web3 provider url
    provider: 'http://localhost:8545',
    // gas price in GWei. If not specified, will use an automatically suggested price.
    gasPrice: 3.4,
    // surpress console output
    quiet: true,
    // disable confirmation messages
    force: true,
    // filepath to output the migration results
    output: 'config/migration.json',
    // private key of the account used in migration (overrides the 'mnemonic' option)
    // privateKey: '0x8d4408014d165ec69d8cc9f091d8f4578ac5564f376f21887e98a6d33a6e3549',
    // mnemonic used to generate the private key of the account used in migration
    // mnemonic: 'behave pipe turkey animal voyage dial relief menu blush match jeans general',
    // migration parameters
    // params: {
    // 	default: {
    // 		// migration params as defined in the "Migration parameters" section below
    // 	},
    // 	private: {
    // 		// overide defaults on private network
    // 	},
    // 	kovan: {
    // 		// overide defaults on kovan
    // 	},
    // }
  };

  // migrate both base and an example DAO
  const migrationResult = await DAOstackMigration.migrate(options); // migrate
  console.log(migrationResult)
}

const runGraphCli = async (args = [], cwd = process.cwd()) => {
  // Resolve the path to graph.js
  // let graphCli = `${require.resolve('@graphprotocol/graph-cli')}/graph.js`
  let graphCli = `${__dirname}/../node_modules/@graphprotocol/graph-cli/graph.js`

  // Make sure to set an absolute working directory
  cwd = cwd[0] !== '/' ? path.resolve(__dirname, cwd) : cwd

  return new Promise((resolve, reject) => {
    let stdout = ''
    let stderr = ''
    const command = `${graphCli} ${args.join(' ')}`
    const child = spawn(command, { cwd })

    child.on('error', error => {
      reject(error)
    })

    child.stdout.on('data', data => {
      stdout += data.toString()
    })

    child.stderr.on('data', data => {
      stderr += data.toString()
    })

    child.on('exit', exitCode => {
      resolve([exitCode, stdout, stderr])
    })
  })
}

async function deploySubgraph() {
  console.log(await runGraphCli([
    'deploy',
    '--access-token \"\"',
    '--ipfs ${ipfs-/ip4/127.0.0.1/tcp/5001}',
    '--node ${node_rpc-http://127.0.0.1:8020/}',
    '-n daostack',
    'subgraph.yaml',
  ]))
  // "deploy": "graph deploy --access-token \"\" --ipfs ${ipfs-/ip4/127.0.0.1/tcp/5001} --node ${node_rpc-http://127.0.0.1:8020/} -n daostack subgraph.yaml",

}

async function main() {
  // await deployDaoStack()
  await configureSubgraph()
  // await deploySubgraph()
}

main()
