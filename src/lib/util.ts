import { Address, IProposalState } from "@daostack/client";
import BN = require("bn.js");
import { getArc } from "../arc";

// TODO: not sure why these helper functions are wrapped in a class
export default class Util {
  public static fromWei(amount: BN): number {
    try {
      return Number(getArc().web3.utils.fromWei(amount.toString(), "ether"));
    } catch (err) {
      console.warn(`Invalid number value passed to fromWei: "${amount}"`);
      return 0;
    }
  }

  public static toWei(amount: number): BN {
    return new BN(getArc().web3.utils.toWei(amount.toString(), "ether"));
  }

  public static getBalance(account: Address) {
    return getArc().web3.eth.getBalance(account);
  }

  public static networkName(id: string) {
    switch (id) {
      case "main":
      case "1":
        return "main";
      case "morden":
      case "2":
        return "morden";
      case "ropsten":
      case "3":
        return "ropsten";
      case "rinkeby":
      case "4":
        return "rinkeby";
      case "kovan":
      case "42":
        return "kovan";
      case "private":
      case "1512051714758":
        return "ganache";
      default:
        return `unknown (${id})`;
    }
  }

  public static copyToClipboard(value: any) {
    const el = document.createElement("textarea");
    el.value = value;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }

  public static async getLatestBlock() {
    try {
      return (await getArc().web3.getBlock("latest")).number;
    } catch (err) {
      throw err;
    }
  }

  public static trace<T>(x: T, ...args: any[]): T {
    // tslint:disable-next-line:no-console
    console.debug("trace", ...args, x);
    return x;
  }

  public static getWeb3() {
    return getArc().web3;
  }
  public static getNetworkId() {
    return getArc().web3.eth.net.getId();
  }

  public static defaultAccount() {
    return getArc().web3.eth.defaultAccount;
  }
}

export function humanProposalTitle(proposal: IProposalState) {
  return proposal.title || "[No title " + proposal.id.substr(0, 6) + "..." + proposal.id.substr(proposal.id.length - 4) + "]";
}

export async function waitUntilTrue(test: () => Promise<boolean> | boolean) {
  return new Promise((resolve) => {
    (async function waitForIt(): Promise<void> {
      if (await test()) { return resolve(); }
      setTimeout(waitForIt, 30);
    })();
  });
}
