import * as Arc from "@daostack/arc.js";
import * as BigNumber from "bignumber.js";

export default class Util {

  public static fromWei(amount: BigNumber.BigNumber) {
    const web3 = Arc.Utils.getWeb3();
    return Number(web3.fromWei(amount, "ether"));
  }

  public static networkName(id: number) {
    switch (id) {
      case 1:
        return "mainnet"
      case 2:
        return "morden"
      case 3:
        return "ropsten"
      case 4:
        return "rinkeby"
      case 42:
        return "kovan"
      default:
        return "unknown network"
    }
  }
}
