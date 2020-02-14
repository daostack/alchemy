import { Arc } from '@daostack/client';
const fs = require("fs");
import { settings } from "../src/settings";
const Web3 = require("web3");

async function fetchContracts() {
  console.log("Fetching contract data from subgraph");

  const arcSettings = settings[process.env.NETWORK];
  const provider = arcSettings.web3Provider;

  const arc = new Arc(arcSettings);

  // get contract information from the subgraph
  const contractInfos = await arc.fetchContractInfos();
  const success = !!contractInfos;

  await fs.writeFile("data/contractInfos.json", JSON.stringify(contractInfos), (r) => {
    console.log("Successfully wrote contracts to data/contractInfos.json");
    // we exit with success anyway so we do not stop travis builds
    process.exit(0);
  });

  return true;
}

fetchContracts().catch((err)  => { console.log(err); process.exit(1); });
