// Run this script with ts-node scripts/mintGen.ts
const BN = require("bn.js");
const promisify = require("es6-promisify");
const { first } = require("rxjs/operators");
const { getArc } = require("../src/arc.ts");

async function main() {
  const arc = getArc();
  const web3 = arc.web3;

  const genToken = await arc.GENToken();
  console.log(`GEN token found at ${genToken.getContract().options.address}`);
  const daoAddress = "0x46d6cdc1dc33a3bf63bb2e654e5622173365ed6a";

  const accounts = await promisify(web3.eth.getAccounts)();
  web3.eth.defaultAccount = accounts[0];

  await Promise.all([daoAddress, ...accounts].map(async (account) => {
    const currentGenBalance = await genToken.balanceOf(account).pipe(first()).toPromise();
    // const currentBalance = await genToken.contract().methods.balanceOf(account).call();
    const diff = new BN(arc.web3.utils.toWei("200000", "ether")).sub(currentGenBalance);
    console.log(`Account ${account} has balance ${arc.web3.utils.fromWei(currentGenBalance)} GEN`);
    if (diff.gt(new BN(0))) {
      console.log(`Minting ${Number(arc.web3.utils.fromWei(diff))} GEN for ${account}`);
      await genToken.mint(account, diff).send();
      const newBalance = await genToken.contract().methods.balanceOf(account).call();
      console.log(`New balance is ${Number(arc.web3.utils.fromWei(newBalance))} GEN for ${account}`);
    } else {
      console.log(`Not minting new GEN for ${account}`);
    }
  }));

  process.exit(0);
}

main();
