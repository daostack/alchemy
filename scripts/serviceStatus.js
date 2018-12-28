const fetch = require('node-fetch')
async function main() {
  let response
  console.log('------------ Service Status --------------------')

  const services = [
    {
      name: 'Alchemy Application',
      url: 'http://0.0.0.0:3000'
    },
    {
      name: 'Local Ethereum node [expect status 400]',
      url: 'http://0.0.0.0:8545'
    },
    {
      name: 'Graph node (http)',
      url: 'http://0.0.0.0:8000'
    },
    {
      name: 'Graphiql interface for daostack',
      url: 'http://127.0.0.1:8000/subgraphs/name/daostack'
    },
    // {
    //   name: 'Graph node (ws)',
    //   url: 'http://0.0.0.0:8001'
    // },
    {
      name: 'Alchemy Server',
      url: 'http://0.0.0.0:3001/explorer'
    },
  ]
  const output = []
  for (service of services) {
      try {
        response = await fetch(service.url)
        console.log(`${service.url} (${service.name}): status ${response.status} ${response.statusText}`)
      } catch(err) {
        console.log(`${service.url} (${service.name}): ${err}`)
      }
  }
  return output
}


if (require.main === module) {
  main()
    .then((output) => {
      for (l of output) {
        console.log(l)
      }
      process.exit(0)
    })
    .catch((err)  => { console.log(err); process.exit(1); });
} else {
  module.exports = main;
}
