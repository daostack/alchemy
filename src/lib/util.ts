import { Address, IProposalState } from "@daostack/client";
import BN = require("bn.js");
import { getArc } from "../arc";

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
  public static async getNetworkId() {
    return await getArc().web3.eth.net.getId();
  }

  public static defaultAccount() {
    return getArc().web3.eth.defaultAccount;
  }
}

export function humanProposalTitle(proposal: IProposalState) {
  return proposal.title ||
    "[No title " + proposal.id.substr(0, 6) + "..." + proposal.id.substr(proposal.id.length - 4) + "]";
}

export function formatTokens(amountWei: BN, symbol?: string): string {
  const negative = amountWei.lt(new BN(0));
  const amount = Math.abs(Util.fromWei(amountWei));
  let returnString;
  if (amount === 0) {
    returnString = "0";
  } else if (amount < 0.01) {
    returnString = "+0";
  } else if (amount < 1000) {
    returnString = amount.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2});
  } else if (amount < 1000000) {
    returnString = (amount / 1000)
      .toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2}) + "k";
  } else {
    returnString = (amount / 1000000)
      .toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2}) + "M";
  }
  return (negative ? "-" : "") + returnString + (symbol ? " " + symbol : "");
}

export function tokenSymbol(tokenAddress: string) {
  let symbol = Object.keys(TOKENS).find((token) => TOKENS[token].toLowerCase() === tokenAddress.toLowerCase());
  return symbol || "?";
}

export async function waitUntilTrue(test: () => Promise<boolean> | boolean, timeOut: number = 1000) {
  return new Promise((resolve, reject) => {
    const timerId = setInterval(async () => {
      if (await test()) { return resolve(); }
    }, 30);
    setTimeout(() => { clearTimeout(timerId); return reject(new Error("Test timed out..")); }, timeOut);
  });
}

export function knownSchemes() {
  const arc = getArc();

  return {
    [arc.contractAddresses.ContributionReward.toLowerCase()]: "Contribution Reward",
    [arc.contractAddresses.SchemeRegistrar.toLowerCase()]: "Scheme Registrar",
    [arc.contractAddresses.GenericScheme.toLowerCase()]: "Generic Scheme",
  };
}

export function schemeName(address: string) {
  const contracts = knownSchemes();
  if (address.toLowerCase() in contracts) {
    return contracts[address.toLowerCase()];
  }

  return address.slice(0, 4) + "..." + address.slice(-4);
}

export async function getNetworkName(id?: string): Promise<string> {
  if (!id) {
    id = (await Util.getNetworkId()).toString();
  }

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
