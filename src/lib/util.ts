import { Address, IContributionReward, IProposalState, IRewardState } from "@daostack/client";
import BN = require("bn.js");
import { GenericSchemeRegistry } from "genericSchemeRegistry";
import { getArc } from "../arc";

const tokens = require("data/tokens.json");
const exchangesList = require("data/exchangesList.json");

export function getExchangesList() {
  return exchangesList;
}

export function copyToClipboard(value: any) {
  const el = document.createElement("textarea");
  el.value = value;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

export function trace<T>(x: T, ...args: any[]): T {
  // tslint:disable-next-line:no-console
  console.debug("trace", ...args, x);
  return x;
}

export function humanProposalTitle(proposal: IProposalState) {
  return proposal.title ||
    "[No title " + proposal.id.substr(0, 6) + "..." + proposal.id.substr(proposal.id.length - 4) + "]";
}

// Convert a value to its base unit based on the number of decimals passed in (i.e. WEI if 18 decimals)
export function toBaseUnit(value: string, decimals: number) {
  const ten = new BN(10);
  const base = ten.pow(new BN(decimals));

  // Is it negative?
  let negative = (value.substring(0, 1) === "-");
  if (negative) {
    value = value.substring(1);
  }

  if (value === ".") {
    throw new Error(
    `Invalid value ${value} cannot be converted to`
    + ` base unit with ${decimals} decimals.`);
  }

  // Split it into a whole and fractional part
  let comps = value.split(".");
  if (comps.length > 2) { throw new Error("Too many decimal points"); }

  let whole = comps[0], fraction = comps[1];

  if (!whole) { whole = "0"; }
  if (!fraction) { fraction = "0"; }
  if (fraction.length > decimals) {
    fraction = fraction.substr(0, decimals);
  }

  while (fraction.length < decimals) {
    fraction += "0";
  }

  const wholeBN = new BN(whole);
  const fractionBN = new BN(fraction);
  let wei = (wholeBN.mul(base)).add(fractionBN);

  if (negative) {
    wei = wei.mul(new BN(-1));
  }

  return new BN(wei.toString(10), 10);
}

export function fromWei(amount: BN): number {
  try {
    return Number(getArc().web3.utils.fromWei(amount.toString(), "ether"));
  } catch (err) {
    console.warn(`Invalid number value passed to fromWei: "${amount}"`);
    return 0;
  }
}

export function toWei(amount: number): BN {
  return new BN(getArc().web3.utils.toWei(amount.toString(), "ether"));
}

export function supportedTokens() {
  return { [getArc().GENToken().address]:  {
    decimals: 18,
    name: "DAOstack GEN",
    symbol: "GEN"
  }, ...tokens};
}

export function formatTokens(amountWei: BN, symbol?: string, decimals = 18): string {
  const negative = amountWei.lt(new BN(0));
  const amount = Math.abs(decimals === 18 ? fromWei(amountWei) : amountWei.div(new BN(10).pow(new BN(decimals))).toNumber());

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

export async function getNetworkId() {
  return await getArc().web3.eth.net.getId();
}

export async function getNetworkName(id?: string): Promise<string> {
  if (!id) {
    id = (await getNetworkId()).toString();
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

export function getClaimableRewards(reward: IRewardState) {
  if (!reward) {
    return {};
  }

  const result: { [key: string]: BN } = {};
  if (reward.reputationForProposer.gt(new BN(0)) && reward.reputationForProposerRedeemedAt === 0) {
    result.reputationForProposer = reward.reputationForProposer;
  }
  if (reward.reputationForVoter.gt(new BN(0)) && reward.reputationForVoterRedeemedAt === 0) {
    result.reputationForVoter = reward.reputationForVoter;
  }

  if (reward.tokensForStaker.gt(new BN(0)) && reward.tokensForStakerRedeemedAt === 0) {
    result.tokensForStaker = reward.tokensForStaker;
  }
  if (reward.daoBountyForStaker.gt(new BN(0)) && reward.daoBountyForStakerRedeemedAt === 0) {
    result.daoBountyForStaker = reward.daoBountyForStaker;
  }
  return result;
}

// TOOD: move this function to the client library!
export function hasClaimableRewards(reward: IRewardState) {
  const claimableRewards = getClaimableRewards(reward);
  for (let key of Object.keys(claimableRewards)) {
    if (claimableRewards[key].gt(new BN(0))) {
      return true;
    }
  }
}

/**
 * given an IContributionReward, return an array with the amounts that are stil to be claimbed
 * by the beneficiary of the proposal
 * @param  reward an object that immplements IContributionReward
 * @return  an array mapping strings to BN
 */
// TODO: use IContributionReward after https://github.com/daostack/client/issues/250 has been resolved
export function claimableContributionRewards(reward: IContributionReward, daoBalances: { [key: string]: BN } = {}) {
  const result: { [key: string]: BN } = {};
  if (
    reward.ethReward &&
    !reward.ethReward.isZero()
    && (daoBalances["eth"] === undefined || daoBalances["eth"].gte(reward.ethReward))
    && reward.alreadyRedeemedEthPeriods < reward.periods
  ) {
    result["eth"] = reward.ethReward;
  }

  if (
    !reward.reputationReward &&
    !reward.reputationReward.isZero()
    && (daoBalances["rep"] === undefined || daoBalances["rep"].gte(reward.reputationReward))
    && Number(reward.alreadyRedeemedReputationPeriods) < Number(reward.periods)
  ) {
    result["rep"] = reward.reputationReward;
  }

  if (
    !reward.nativeTokenReward &&
    !reward.nativeTokenReward.isZero()
    && (daoBalances["nativeToken"] === undefined || daoBalances["nativeToken"].gte(reward.nativeTokenReward))
    && Number(reward.alreadyRedeemedNativeTokenPeriods) < Number(reward.periods)
  ) {
    result["nativeToken"] = reward.nativeTokenReward;
  }

  if (reward.externalTokenReward &&
    !reward.externalTokenReward.isZero()
    && (daoBalances["externalToken"] === undefined || daoBalances["externalToken"].gte(reward.externalTokenReward))
    && Number(reward.alreadyRedeemedExternalTokenPeriods) < Number(reward.periods)
  ) {
    result["externalToken"] = reward.externalTokenReward;
  }
  return result;
}

export function splitByCamelCase(str: string) {
  return str.replace(/([A-Z])/g, " $1");
}
