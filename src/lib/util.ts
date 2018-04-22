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
   * Performs an Arc.js action.
   * @param topic Arc.js TransactionService topic to listen to for pending transactions
   * @param f action to perform
   * @param opts options to pass to @f
   * @param onPending callback that's called on every pending transaction
   * @param onError callback that's called upon any error / failed transaction
   */
  public static async performAction<T>(topic: string, f: (opts: any) => Promise<T>, opts: any, onPending: (txCount: number) => any, onError: (e: Error) => any): Promise<T> {
    let sub: Arc.IEventSubscription;
    let count = 0;
    try {
      const key = Arc.TransactionService.generateInvocationKey(`${topic}.pendingTransactions`);
      sub = Arc.TransactionService.subscribe(topic, (topic, info) => {
        if (info.options.key === key && info.tx) {
          if (Arc.Utils.getWeb3().toDecimal(info.tx.receipt.status) !== 1) {
            console.error(info.tx);
            const err = new Error(`Transaction '${info.tx.receipt.transactionHash}' failed on '${topic}' with options '${JSON.stringify(opts, undefined, 2)}'`);
            console.error(err);
            onError(err);
            sub.unsubscribe();
          } else {
            onPending(info.txCount);
            count++;
            if (count == info.txCount) {
              sub.unsubscribe();
            }
          }
        }
      });
      const result = await f({...opts, key});
      return result;
    } catch (e) {
      if (sub) {
        sub.unsubscribe();
      }
      console.error(e);
      onError(e);
    }
  }
}
