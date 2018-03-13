import * as Arc from "@daostack/arc.js";
import * as BigNumber from "bignumber.js";

export default class Util {

  public static fromWei(amount: BigNumber.BigNumber) {
    const web3 = Arc.Utils.getWeb3();
    return Number(web3.fromWei(amount, "ether"));
  }

}
