const path = require('path');
const subgraphRepo = path.resolve('./node_modules/@daostack/subgraph');

async function main () {
  console.log(await require(`${subgraphRepo}/ops/setup-env`)(path.resolve('..')));
}

main().catch((err) => { console.log(err); process.exit(1); });
