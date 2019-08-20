import { promisify } from "util";
import {
  Address,
  IContractInfo,
  IContributionReward,
  IProposalState,
  IRewardState,
  ISchemeState } from "@daostack/client";
import { GenericSchemeRegistry } from "genericSchemeRegistry";
import { getArc } from "../arc";

import BN = require("bn.js");
const Web3 = require("web3");
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

export function humanProposalTitle(proposal: IProposalState) {
  return proposal.title ||
    "[No title " + proposal.id.substr(0, 6) + "..." + proposal.id.substr(proposal.id.length - 4) + "]";
}

// Convert a value to its base unit based on the number of decimals passed in (i.e. WEI if 18 decimals)
export function toBaseUnit(value: string, decimals: number) {
  const ten = new BN(10);
  const base = ten.pow(new BN(decimals));

  // Is it negative?
  const negative = (value.substring(0, 1) === "-");
  if (negative) {
    value = value.substring(1);
  }

  if (value === ".") {
    throw new Error(
      `Invalid value ${value} cannot be converted to`
    + ` base unit with ${decimals} decimals.`);
  }

  // Split it into a whole and fractional part
  const comps = value.split(".");
  if (comps.length > 2) { throw new Error("Too many decimal points"); }

  let whole = comps[0]; let fraction = comps[1];

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
    return Number(Web3.utils.fromWei(amount.toString(), "ether"));
  } catch (err) {
    console.warn(`Invalid number value passed to fromWei: "${amount}": ${err.message}`);
    return 0;
  }
}

export function toWei(amount: number): BN {
  /** 
   * toFixed to avoid the sci notation that javascript creates for large and small numbers.
   * toWei barfs on it.
   */
  return new BN(getArc().web3.utils.toWei(amount.toFixed(18).toString(), "ether"));
}

export function supportedTokens() {
  return { [getArc().GENToken().address]:  {
    decimals: 18,
    name: "DAOstack GEN",
    symbol: "GEN",
  }, ...tokens};
}

export function formatTokens(amountWei: BN, symbol?: string, decimals = 18): string {

  const negative = amountWei.lt(new BN(0));
  const toSignedString = (amount: string) => { return  (negative ? "-" : "") + amount + (symbol ? " " + symbol : ""); };
  
  if (amountWei.isZero()) {
    return toSignedString("0");
  } 

  const PRECISION = 2; // number of digits "behind the dot"
  const PRECISIONPOWER = 10 ** PRECISION;
  const toLocaleString = (amount: number): string =>
  {
    return amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: PRECISION });
  };

  let significantDigits = 0;
  let units = "";

  /**
   * Like converting from WEI where 18 is a variable, not a constant.
   * `abs` because the number can be negative.  We'll convert back to signed at the end.
   * Note this yields a whole number of tokens, not a fraction.
   */
  const tokenAmount = amountWei.mul(new BN(PRECISIONPOWER)).div(new BN(10).pow(new BN(decimals))).abs();

  if (tokenAmount.muln(PRECISION).eqn(0)) {
    return toSignedString("+0");
  } else if (tokenAmount.bitLength() > 53) {
    significantDigits = 1000000000;
    units = "B";
  }
  else if (tokenAmount.ltn(1000)) {
    significantDigits = 1;
  } else if (tokenAmount.ltn(1000000)) {
    significantDigits = 1000;
    units = "k";
  } else {
    significantDigits = 1000000;
    units = "M";
  }

  const fractionalNumber = tokenAmount.div(new BN(significantDigits)).toNumber() / PRECISIONPOWER;
  const returnString = `${toLocaleString(fractionalNumber)}${units}`;

  return toSignedString(returnString);
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


export const KNOWN_SCHEME_NAMES = [
  "ContributionReward",
  "GenericScheme",
  "ReputationFromToken",
  "SchemeRegistrar",
];

export const PROPOSAL_SCHEME_NAMES = [
  "ContributionReward",
  "GenericScheme",
  "SchemeRegistrar",
];

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

  if (KNOWN_SCHEME_NAMES.includes(contractInfo.name)) {
    return true;
  } else {
    return false;
  }
}

export function schemeName(scheme: ISchemeState|IContractInfo, fallback?: string) {
  let name: string;
  if (scheme.name === "GenericScheme") {
    // @ts-ignore
    if (scheme.genericSchemeParams) {
      const genericSchemeRegistry = new GenericSchemeRegistry();
      // @ts-ignore
      const genericSchemeInfo = genericSchemeRegistry.getSchemeInfo(scheme.genericSchemeParams.contractToCall);
      if (genericSchemeInfo) {
        name = genericSchemeInfo.specs.name;
      } else {
        name = "Generic Scheme";
      }
    } else {
      name = "Generic Scheme";
    }
  } else if (scheme.name) {
    // add spaces before capital letters to approximate a human-readable title
    name = scheme.name.replace(/([A-Z])/g, " $1");
  } else {
    name = fallback;
  }
  return name;
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

/**
 * return network id, independent of the presence of Arc
 * @param web3Provider
 */
export async function getNetworkId(web3Provider?: any): Promise<string> {
  let arc: any;
  let web3: any;

  try {
    arc = getArc();
  } catch (ex) {
    // Do nothing
  }

  /**
   * make sure that if the web3Provider is passed in, then the web3 we use matches it
   */
  if (arc && arc.web3 && (!web3Provider || (arc.web3.currentProvider === web3Provider))) {
    web3 = arc.web3;
  } else if ((window as any).web3 &&
    (!web3Provider || ((window as any).web3.currentProvider === web3Provider))) {
    web3 = (window as any).web3;
  } else if (web3Provider) {
    web3 = new Web3(web3Provider);
  }

  if (!web3) {
    throw new Error("getNetworkId: unable to find web3");
  }

  return (await (web3.eth.net ? web3.eth.net.getId() : promisify(web3.version.getNetwork)())).toString();
}

export async function getNetworkName(id?: string): Promise<string> {

  if (!id) {
    id = await getNetworkId();
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
  if (arc.web3.currentProvider.__networkId === "4") {
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
  for (const key of Object.keys(claimableRewards)) {
    if (claimableRewards[key].gt(new BN(0))) {
      return true;
    }
  }
  return false;
}

/**
 * given an IContributionReward, return an array with the amounts that are stil to be claimbed
 * by the beneficiary of the proposal
 * @param  reward an object that immplements IContributionReward
 * @return  an array mapping strings to BN
 */
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
    reward.reputationReward &&
    !reward.reputationReward.isZero()
    && (daoBalances["rep"] === undefined || daoBalances["rep"].gte(reward.reputationReward))
    && Number(reward.alreadyRedeemedReputationPeriods) < Number(reward.periods)
  ) {
    result["rep"] = reward.reputationReward;
  }

  if (
    reward.nativeTokenReward &&
    !reward.nativeTokenReward.isZero()
    && (daoBalances["nativeToken"] === undefined || daoBalances["nativeToken"].gte(reward.nativeTokenReward))
    && Number(reward.alreadyRedeemedNativeTokenPeriods) < Number(reward.periods)
  ) {
    result["nativeToken"] = reward.nativeTokenReward;
  }

  if (
    reward.externalTokenReward &&
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

/*
 * to really do this well, should probably use a javascript library devoted to handling all of the crazy cases.
 */
// eslint-disable-next-line no-useless-escape
const pattern = new RegExp(/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/);

export function isValidUrl(str: string, emptyOk: boolean = true): boolean {
  return (emptyOk && (!str || !str.trim())) || (str && pattern.test(str));
}
