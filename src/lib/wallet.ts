import * as Arc from "@daostack/arc.js";
const ethers = require('ethers');

const getWallet = async () => {
  const web3 = await Arc.Utils.getWeb3();
  const provider = new ethers.providers.Web3Provider(web3.currentProvider);
  return provider.getSigner();
}

export default getWallet;
