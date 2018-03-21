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
        return "Mainnet"
      case 2:
        return "Morden"
      case 3:
        return "Ropsten"
      case 4:
        return "Rinkeby"
      case 42:
        return "Kovan"
      case 1512051714758:
        return "Ganache"
      default:
        return "Unknown network"
    }
  }
}
