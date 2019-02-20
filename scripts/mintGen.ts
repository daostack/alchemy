const BN = require("bn.js");
const promisify = require("es6-promisify");
const { first } = require("rxjs/operators");
import { getArc } from "../src/arc";

async function main() {
  const arc = getArc();
  const web3 = arc.web3;

  const genToken = await arc.GENToken();

  const daoAddress = '0x46d6cdc1dc33a3bf63bb2e654e5622173365ed6a';

  const accounts = await promisify(web3.eth.getAccounts)();
  web3.eth.defaultAccount = accounts[0];

  await Promise.all([daoAddress, ...accounts].map(async account => {
    const currentGenBalance = await genToken.balanceOf(account).pipe(first()).toPromise();
    const diff = new BN(arc.web3.utils.toWei("200000", "ether")).sub(currentGenBalance);
    if(diff.gt(new BN(0))) {
      console.log(`Minting ${Number(arc.web3.utils.fromWei(diff))} GEN for ${account}`);
      await genToken.mint(account, diff).send();
    }
  }));

  process.exit(0);
}

main();
