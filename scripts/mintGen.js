const Arc = require('@daostack/arc.js');
const { BigNumber } = require('bignumber.js');

async function main() {
  const web3 = await Arc.Utils.getWeb3()

  const genTokenAddress = await Arc.Utils.getGenTokenAddress()
  const DAOToken = await Arc.Utils.requireContract('DAOToken');
  const genToken = await DAOToken.at(genTokenAddress)

  await Promise.all(web3.eth.accounts.map(async account => {
    const diff = new BigNumber(web3.toWei(1000)).minus(await genToken.balanceOf(account))
    if(diff.gt(0)) {
      console.log(`Minting ${web3.fromWei(diff)} GEN for ${account}`);
      await genToken.mint(account, diff)
    }
  }))
}

main()
