import { Address, IProposalState } from "@daostack/client";
import BN = require("bn.js");
import { checkNetwork, getArc } from "../arc";

// haven’t figured out how to get web3 typings to properly expose the Web3 constructor.
// v1.0 may improve on this entire Web3 typings experience
/* tslint:disable-next-line:no-var-requires */
const Web3 = require("web3");
const path = require("path");

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
      case "1":
        return "mainnet";
      case "2":
        return "morden";
      case "3":
        return "ropsten";
      case "4":
        return "rinkeby";
      case "42":
        return "kovan";
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

/**
 * check if the web3 connection is ready to send transactions, and warn the user if it is not
 * @return true if things are fine, false if not
 */
export function checkNetworkAndWarn(): boolean {
  try {
    checkNetwork();
    return true;
  } catch (err) {
    // TODO: this should of course not be an alert, but a Modal
    alert(`Cannot send transction: ${err.message}`);
    return false;
  }
}

export function humanProposalTitle(proposal: IProposalState) {
  return proposal.title || "[No title " + proposal.id.substr(0, 6) + "..." + proposal.id.substr(proposal.id.length - 4) + "]";
}
