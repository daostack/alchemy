import { Address, IContributionReward, IProposalState, IRewardState } from "@daostack/client";
import BN = require("bn.js");
import { GenericSchemeRegistry } from "genericSchemeRegistry";
import { getArc } from "../arc";

const tokens = require("data/tokens.json");
const exchangesList = require("data/exchangesList.json");

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

export function supportedTokens() {
  tokens[getArc().GENToken().address] = {
    decimals: 18,
    name: "DAOstack GEN",
    symbol: "GEN"
  };

  return tokens;
}

export function getExchangesList() {
  return exchangesList;
}

export function formatTokens(amountWei: BN, symbol?: string, decimals = 18): string {
  const negative = amountWei.lt(new BN(0));
  const amount = Math.abs(decimals === 18 ? Util.fromWei(amountWei) : amountWei.div(new BN(10).pow(new BN(decimals))).toNumber());

  let returnString;
  if (amount === 0) {
    returnString = "0";
  } else if (amount < 0.01) {
    returnString = "+0";
  } else if (amount < 1000) {
    returnString = amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  } else if (amount < 1000000) {
    returnString = (amount / 1000)
      .toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + "k";
  } else {
    returnString = (amount / 1000000)
      .toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + "M";
  }
  return (negative ? "-" : "") + returnString + (symbol ? " " + symbol : "");
}

export function tokenDetails(tokenAddress: string) {
  return supportedTokens()[tokenAddress.toLowerCase()];
}

export function tokenSymbol(tokenAddress: string) {
  const token = supportedTokens()[tokenAddress.toLowerCase()];
  return token ? token["symbol"] : "?";
}

export async function waitUntilTrue(test: () => Promise<boolean> | boolean, timeOut: number = 1000) {
  return new Promise((resolve, reject) => {
    const timerId = setInterval(async () => {
      if (await test()) { return resolve(); }
    }, 30);
    setTimeout(() => { clearTimeout(timerId); return reject(new Error("Test timed out..")); }, timeOut);
  });
}

/**
 * return true if the address is the address of a known scheme (which we know how to represent)
 * @param  address [description]
 * @return         [description]
 */
export function isKnownScheme(address: Address) {
  const arc = getArc();
  let contractInfo;
  try {
    contractInfo = arc.getContractInfo(address);
  } catch (err) {
    if (err.message.match(/no contract/i)) {
      return false;
    }
    throw err;
  }

  if (["ContributionReward", "SchemeRegistrar", "GenericScheme"].includes(contractInfo.name)) {
    return true;
  } else {
    return false;
  }
}

/**
 * given the address (of a scheme), return  a friendly string represeting the scheme's address and it'sname
 * @param  address [description]
 * @return         [description]
 */
export function schemeNameAndAddress(address: string) {
  const arc = getArc();
  try {
    const contractInfo = arc.getContractInfo(address);
    const name = schemeName(contractInfo);

    if (name) {
      return `${address.slice(0, 4)}...${address.slice(-4)} (${name})`;
    } else {
      return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }
  } catch (err) {
    if (err.message.match(/No contract/)) {
      return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }
  }
}

export function schemeName(scheme: any, fallback?: string) {
  let name: string;
  if (scheme.name === "GenericScheme") {
    const genericSchemeRegistry = new GenericSchemeRegistry();
    const genericSchemeInfo = genericSchemeRegistry.getSchemeInfo(scheme.address);
    if (genericSchemeInfo) {
      name = genericSchemeInfo.specs.name;
    } else {
      name = "Generic Scheme";
    }
  } else if (scheme.name) {
    // add spaces before capital letters to approximate a human-readable title
    name = scheme.name.replace(/([A-Z])/g, " $1");
  } else {
    name =  fallback;
  }
  return name;
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

export function linkToEtherScan(address: Address) {
  let prefix = "";
  const arc = getArc();
  if (arc.web3.currentProvider.networkVersion === "4") {
    prefix = "rinkeby.";
  }
  return `https://${prefix}etherscan.io/address/${address}`;
}

/**
 * given an IRewardState, return an IRewardState with only rewards yet to be claimed
 * @param reward an object that implements IRewardState
 * @return IRewardState
 */
export function getClaimableRewards(reward: IRewardState): IRewardState | null {
  if (!reward) {
    return null;
  }

  const claimableReward = reward;
  if (reward.reputationForProposer.lte(new BN(0)) || reward.reputationForProposerRedeemedAt !== 0) {
    claimableReward.reputationForProposer = 0;
  }
  if (reward.reputationForVoter.lte(new BN(0)) || reward.reputationForVoterRedeemedAt !== 0) {
    claimableReward.reputationForVoter = 0;
  }
  if (reward.tokensForStaker.lte(new BN(0)) || reward.tokensForStakerRedeemedAt !== 0) {
    claimableReward.tokensForStaker = 0;
  }
  if (reward.daoBountyForStaker.lte(new BN(0)) || reward.daoBountyForStakerRedeemedAt !== 0) {
    claimableReward.daoBountyForStaker = 0;
  }
  if (!claimableReward.reputationForProposer.isZero() ||
      !claimableReward.reputationForVoter.isZero() ||
      !claimableReward.tokensForStaker.isZero() ||
      !claimableReward.daoBountyForStaker.isZero()) {
    return claimableReward;
  } else {
    return null;
  }
}

/**
 * given an IContributionReward, return a IContributionReward with only rewards yet to be claimed
 * by the beneficiary of the proposal
 * @param reward an object that implements IContributionReward
 * @param daoBalances an object with the current DAO balances for all the relevant tokens
 * @return IContributionReward
 */
export function getClaimableContributionRewards(reward: IContributionReward, daoBalances: { [key: string]: BN } = {}) {
  if (!reward) {
    return null;
  }

  const claimableRewards = reward;
  if (
    !reward.ethReward.isZero()
    && (daoBalances["eth"] === undefined
        || daoBalances["eth"].lt(reward.ethReward)
        || Number(reward.alreadyRedeemedEthPeriods) >= Number(reward.periods))
  ) {
    claimableRewards.ethReward = new BN(0);
  }

  if (
    !reward.reputationReward.isZero()
    && (daoBalances["rep"] === undefined
        || daoBalances["rep"].lt(reward.reputationReward)
        || Number(reward.alreadyRedeemedReputationPeriods) >= Number(reward.periods))
  ) {
    claimableRewards.reputationReward = new BN(0);
  }

  if (
    !reward.nativeTokenReward.isZero()
    && (daoBalances["nativeToken"] === undefined
        || daoBalances["nativeToken"].lt(reward.nativeTokenReward)
        || Number(reward.alreadyRedeemedNativeTokenPeriods) >= Number(reward.periods))
  ) {
    claimableRewards.nativeTokenReward = new BN(0);
  }

  if (
    !reward.externalTokenReward.isZero()
    && (daoBalances["externalToken"] === undefined
        || daoBalances["externalToken"].lt(reward.externalTokenReward)
        || Number(reward.alreadyRedeemedExternalTokenPeriods) >= Number(reward.periods))
  ) {
    claimableRewards.externalTokenReward = new BN(0);
  }

  if (!claimableRewards.ethReward.isZero() ||
      !claimableRewards.reputationReward.isZero() ||
      !claimableRewards.nativeTokenReward.isZero() ||
      !claimableRewards.externalTokenReward.isZero()) {
    return claimableRewards;
  } else {
    return null;
  }
}

export function splitByCamelCase(str: string) {
  return str.replace(/([A-Z])/g, " $1");
}
