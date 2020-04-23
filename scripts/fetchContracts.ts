import { Arc } from '@daostack/client-experimental';
const fs = require("fs");
import { settings } from "../src/settings";

const network = process.argv[2] || process.env.NETWORK;
if (!network) {
  console.error("Please set the NETWORK env var or pass in the network name as an arg to use this script");
  process.exit(1);
}

process.env.NETWORK = network;

async function fetchContracts() {
  console.log("Fetching contract data from subgraph for network", network);

  const arcSettings = settings[network];
  const provider = arcSettings.web3Provider;

  const arc = new Arc(arcSettings);

  // get contract information from the subgraph
  const contractInfos = await arc.fetchContractInfos();

  await fs.writeFile(`data/contractInfos-${network}.json`, JSON.stringify(contractInfos), (r) => {
    console.log(`Successfully wrote contracts to data/contractInfos-${network}.json`);
    // we exit with success anyway so we do not stop travis builds
    process.exit(0);
  });

  return true;
}

fetchContracts().catch((err)  => { console.log(err); process.exit(1); });
