import * as Arc from "@daostack/arc.js";
import { BigNumber } from "bignumber.js";
import { IEventSubscription, TransactionReceiptsEventInfo } from "@daostack/arc.js";

// haven’t figured out how to get web3 typings to properly expose the Web3 constructor.
// v1.0 may improve on this entire Web3 typings experience
/* tslint:disable-next-line:no-var-requires */
const Web3 = require("web3");

export default class Util {

  public static fromWei(amount: BigNumber): BigNumber {
    const web3 = new Web3();
    return web3.fromWei(amount, "ether");
  }

  // TODO: should probably return a BigNumber instead of a string.
  public static toWei(amount: number): string {
    const web3 = new Web3();
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
   * @param action Function that will invoke the action to perform
   * @param opts options to pass to @f
   * @param onKickoff callback that's called before starting any transactions. It gets passed the total transaction count
   * @param onTransaction callback that's called after every transaction completes. It gets passed the info about the transaction
   */
  public static async performAction<T>(
    topic: string,
    action: (opts: any) => Promise<T>,
    opts: any,
    onKickoff: (txCount: number) => any,
    onTransaction?: (tx: any) => any
  ): Promise<T> {

    let sub: IEventSubscription;
    const unsubscribe = () => {
      if (sub) {
        // workaround to get last transaction notification before unsubscribing.
        setTimeout(sub.unsubscribe, 0);
      }
    }

    try {
      const key = Arc.TransactionService.generateInvocationKey();
      sub = Arc.TransactionService.subscribe([`${topic}.kickoff`, `${topic}.mined`], (topic, info: TransactionReceiptsEventInfo) => {
        if (info.options.key === key && info.tx == null) {
          onKickoff(info.txCount);
        }
        if (info.options.key === key && info.tx && onTransaction) {
          onTransaction(info);
        }
      });
      const result = await action({ ...opts, key });
      unsubscribe();
      return result;
    } catch (e) {
      console.error("Error performing operation " + topic + ": ", e);
      unsubscribe();
      throw e;
    }
  }

  public static copyToClipboard(value: any) {
    const el = document.createElement('textarea');
    el.value = value;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
}
