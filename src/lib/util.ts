import * as Arc from "@daostack/arc.js";
import { BigNumber } from "bignumber.js";

export default class Util {

  public static fromWei(amount: BigNumber): BigNumber {
    const web3 = Arc.Utils.getWeb3();
    return web3.fromWei(amount, "ether");
  }

  // TODO: should probably return a BigNumber instead of a string.
  public static toWei(amount: number): string {
    const web3 = Arc.Utils.getWeb3();
    return web3.toWei(amount, "ether");
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

  /**
   * Subscribes to pending transactions for a specific operation.
   * Unsubscribes automatically.
   * @param topic Arc.js TransactionService topic
   * @param key A unique `key` to look for in `txEventInfo.options`
   * @param cb A callback to execute on each pending transaction.
   */
  public static onPendingTransactions(topic: string, key: symbol, cb: (txCount: number) => any) {
    let count = 0;
    const sub = Arc.TransactionService.subscribe(topic, (topic: string, txEventInfo: any) => {
      if (txEventInfo.options.key === key && txEventInfo.tx) {
        cb(txEventInfo.txCount);
        count++;
        if (count >= txEventInfo.txCount) {
          sub.unsubscribe();
        }
      }
    });
  }
}
