const { BigNumber } = require('bignumber.js');
const Arc = require('@daostack/arc.js');
const { InitializeArcJs } = require("@daostack/arc.js");

async function main() {
  const web3 = await Arc.Utils.getWeb3()
  await InitializeArcJs()
  const genTokenAddress = await Arc.Utils.getGenTokenAddress()
  const DAOToken = await Arc.Utils.requireContract('DAOToken');
  const genToken = await DAOToken.at(genTokenAddress)

  const daoAddress = '0xf7b7be05d6c115184f78226f905b643dd577fa6b';

  await Promise.all([daoAddress, ...web3.eth.accounts].map(async account => {
    const diff = new BigNumber(web3.toWei(100000)).minus(await genToken.balanceOf(account))
    if(diff.gt(0)) {
      console.log(`Minting ${web3.fromWei(diff)} GEN for ${account}`);
      await genToken.mint(account, diff)
    }
  }))
}

main()
