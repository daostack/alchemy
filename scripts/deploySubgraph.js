const spawn = require('spawn-command')
const fs = require('fs')
const path = require('path')

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

async function deploySubgraph(cwd) {
  await runGraphCli([
    'deploy',
    '--access-token \"\"',
    '--ipfs ${ipfs-/ip4/127.0.0.1/tcp/5001}',
    '--node ${node_rpc-http://127.0.0.1:8020/}',
    '-n daostack',
    // './config/subgraph.yaml',
    '../subgraph/subgraph.yaml'
  ], cwd)
}

module.exports = {
  deploySubgraph
}
