import { promisify } from "util";
import { targetedNetwork } from "arc";
import {
  Address,
  IContractInfo,
  IProposalStage,
  IProposalState,
  IRewardState,
  ISchemeState} from "@daostack/client";
import { GenericSchemeRegistry } from "genericSchemeRegistry";
import { of } from "rxjs";
import { catchError } from "rxjs/operators";

import BN = require("bn.js");
/**
 * gotta load moment in order to use moment-timezone directly
 */
import "moment";
import * as moment from "moment-timezone";
import { rewarderContractName } from "components/Scheme/ContributionRewardExtRewarders/rewardersProps";
import { getArc } from "../arc";


const Web3 = require("web3");
const tokens = require("data/tokens.json");
const exchangesList = require("data/exchangesList.json");

export function getExchangesList() {
  return exchangesList;
}

export function checkTotalPercent(split: any) {
  let sum = 0;
  for (const p of split) {
    try {
      sum += Number(p);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`Invalid percentage value passed: "${p}": ${err.message}`);
    }
  }
  return (sum === 100.0);

}

export function addSeconds(date: Date, seconds: number) {
  date.setTime(date.getTime() + seconds);
  return date;
}

export function copyToClipboard(value: any) {
  const el = document.createElement("textarea");
  el.value = value;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

export const truncateWithEllipses = (str: string, length: number): string => {
  const ellipse = "...";
  if (str.length > length) {
    return str.substring(0, length - ellipse.length) + ellipse;
  } else {
    return str;
  }
};

export function humanProposalTitle(proposal: IProposalState, truncateToLength=0) {
  const title = proposal.title ||
    "[No title " + proposal.id.substr(0, 6) + "..." + proposal.id.substr(proposal.id.length - 4) + "]";
  return truncateToLength ? truncateWithEllipses(title, truncateToLength): title;
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
    // eslint-disable-next-line no-console
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

export function baseTokenName() {
  return tokens[targetedNetwork()]["baseTokenName"];
}

export function genName() {
  return tokens[targetedNetwork()]["genName"];
}

export function supportedTokens() {
  return { [getArc().GENToken().address]:  {
    decimals: 18,
    name: "DAOstack GEN",
    symbol: genName(),
  }, ...tokens[targetedNetwork()]["tokens"]};
}

export function formatTokens(amountWei: BN|null, symbol?: string, decimals = 18): string {

  if (amountWei === null) {
    return `N/A ${symbol ? symbol: ""}`;
  }

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
  else if (tokenAmount.ltn(100000)) {
    significantDigits = 1;
  } else if (tokenAmount.lt(new BN(100000000))) {
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

export function tokenDecimals(tokenAddress: string) {
  const token = supportedTokens()[tokenAddress.toLowerCase()];
  return token ? token["decimals"] : 18;
}

export async function waitUntilTrue(test: () => Promise<boolean> | boolean, timeOut = 1000) {
  return new Promise((resolve, reject) => {
    const timerId = setInterval(async () => {
      if (await test()) { return resolve(); }
    }, 30);
    setTimeout(() => { clearTimeout(timerId); return reject(new Error("Test timed out..")); }, timeOut);
  });
}

export function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve: () => void): any => setTimeout(resolve, milliseconds));
}

/** schemes that we know how to interpret  */
export const KNOWN_SCHEME_NAMES = [
  "ContributionReward",
  "GenericScheme",
  "ReputationFromToken",
  "SchemeRegistrar",
  "UGenericScheme",
  "Competition",
  "ContributionRewardExt",
];

export const PROPOSAL_SCHEME_NAMES = [
  "ContributionReward",
  "GenericScheme",
  "SchemeRegistrar",
  "UGenericScheme",
  "Competition",
  "ContributionRewardExt",
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
  if (scheme.name === "GenericScheme" || scheme.name === "UGenericScheme") {
    if ((scheme as any).genericSchemeParams || ((scheme as any).uGenericSchemeParams)) {
      const genericSchemeRegistry = new GenericSchemeRegistry();
      let contractToCall;
      const schemeState = scheme as ISchemeState;
      if (schemeState.genericSchemeParams) {
        contractToCall = schemeState.genericSchemeParams.contractToCall;
      } else {
        contractToCall = schemeState.uGenericSchemeParams.contractToCall;
      }
      const genericSchemeInfo = genericSchemeRegistry.getSchemeInfo(contractToCall);
      if (genericSchemeInfo) {
        name = genericSchemeInfo.specs.name;
      } else {
        // Adding the address is a bit long for a title
        // name = `Blockchain Interaction (${contractToCall})`;
        name = "Blockchain Interaction";
      }
    } else {
      // this should never happen...
      name = "Blockchain Interaction";
    }
  } else if (scheme.name === "ContributionReward") {
    name ="Funding and Voting Power";
  } else if (scheme.name === "SchemeRegistrar") {
    name ="Plugin Manager";
  } else if (scheme.name) {
    if (scheme.name === "ContributionRewardExt") {
      name = rewarderContractName(scheme as ISchemeState);
    } else {
      // add spaces before capital letters to approximate a human-readable title
      name = `${scheme.name[0]}${scheme.name.slice(1).replace(/([A-Z])/g, " $1")}`;
    }
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
    case "xdai":
    case "100":
      return "xdai";
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

export type AccountClaimableRewardsType = { [key: string]: BN };
/**
 * Returns an object describing GenesisProtocol non-zero, unredeemed reward amounts for the current user, optionally
 * filtered by whether the DAO has the funds to pay the rewards.
 * @param reward unredeemed GP rewards for the current user
 * @param daoBalances
 */
export function getGpRewards(reward: IRewardState, daoBalances: { [key: string]: BN } = {}): AccountClaimableRewardsType {
  if (!reward) {
    return {};
  }

  const result: AccountClaimableRewardsType = {};
  if (reward.reputationForProposer.gt(new BN(0)) && reward.reputationForProposerRedeemedAt === 0) {
    result.reputationForProposer = reward.reputationForProposer;
  }
  if (reward.reputationForVoter.gt(new BN(0)) && reward.reputationForVoterRedeemedAt === 0) {
    result.reputationForVoter = reward.reputationForVoter;
  }
  /**
   * note the following assume that the GenesisProtocol is using GEN for staking
   */
  if (reward.tokensForStaker.gt(new BN(0))
    && (daoBalances["GEN"] === undefined || daoBalances["GEN"].gte(reward.tokensForStaker))
    && (reward.tokensForStakerRedeemedAt === 0)) {
    result.tokensForStaker = reward.tokensForStaker;
  }
  if (reward.daoBountyForStaker.gt(new BN(0))
    && (daoBalances["GEN"] === undefined || daoBalances["GEN"].gte(reward.daoBountyForStaker))
    && (reward.daoBountyForStakerRedeemedAt === 0)) {
    result.daoBountyForStaker = reward.daoBountyForStaker;
  }
  return result;
}

// TOOD: move this function to the client library!
export function hasGpRewards(reward: IRewardState) {
  const claimableRewards = getGpRewards(reward);
  for (const key of Object.keys(claimableRewards)) {
    if (claimableRewards[key].gt(new BN(0))) {
      return true;
    }
  }
  return false;
}

/**
 * Returns an object describing ContributionReward non-zero, unredeemed reward amounts for the CR beneficiary, optionally
 * filtered by whether the DAO has the funds to pay the rewards.
 * @param  reward unredeemed CR rewards
 * @param daoBalances
 */
export function getCRRewards(proposalState: IProposalState, daoBalances: { [key: string]: BN|null } = {}): AccountClaimableRewardsType {
  const result: AccountClaimableRewardsType = {};

  if (proposalState.stage === IProposalStage.ExpiredInQueue) {
    return {};
  }

  const reward = proposalState.contributionReward;
  if (
    reward.ethReward &&
    !reward.ethReward.isZero()
    && (daoBalances["eth"] === undefined || daoBalances["eth"]=== null|| daoBalances["eth"].gte(reward.ethReward))
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

export function hasCrRewards(reward: IProposalState) {
  const claimableRewards = getCRRewards(reward);
  for (const key of Object.keys(claimableRewards)) {
    if (claimableRewards[key].gt(new BN(0))) {
      return true;
    }
  }
  return false;
}

export function splitByCamelCase(str: string) {
  return str.replace(/([A-Z])/g, " $1");
}

/*
 * to really do this well, should probably use a javascript library devoted to handling all of the crazy cases.
 */
// eslint-disable-next-line no-useless-escape
const pattern = new RegExp(/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/);

export function isValidUrl(str: string, emptyOk = true): boolean {
  return (emptyOk && (!str || !str.trim())) || (str && pattern.test(str));
}



export enum GetSchemeIsActiveActions {
  Register=1,
  Remove
}

const schemeActionPropNames = new Map<string, Map<GetSchemeIsActiveActions, string>>([
  [
    "SchemeRegistrar" , new Map<GetSchemeIsActiveActions, string>([
      [GetSchemeIsActiveActions.Register, "voteRegisterParams"],
      [GetSchemeIsActiveActions.Remove, "voteRemoveParams"],
    ]),
  ],
]);

export function getSchemeIsActive(scheme: ISchemeState, action?: GetSchemeIsActiveActions): boolean {
  let votingMachineParamsPropertyName: string;
  let schemeName = `${scheme.name[0].toLowerCase()}${scheme.name.slice(1)}`;
  if (schemeName === "genericScheme") {
    if (scheme.uGenericSchemeParams) {
      schemeName = "uGenericScheme";
    }
  }

  if (action) { // then the name of the voting machine properties property depends on the action
    const schemeActionsMap = schemeActionPropNames.get(scheme.name);

    if (!schemeActionsMap) {
      throw new Error(`getSchemeIsActive: unknown scheme: ${scheme.name}`);
    }
    const propName = schemeActionsMap.get(action);
    if (!propName) {
      throw new Error(`getSchemeIsActive: unknown action: ${scheme.name}:${action}`);
    }
    votingMachineParamsPropertyName = propName;
  } else {
    /**
     * if scheme is SchemeRegistrar, then it is active if any of its actions are active
     */
    if (scheme.name === "SchemeRegistrar") {
      return getSchemeIsActive(scheme, GetSchemeIsActiveActions.Register) || getSchemeIsActive(scheme, GetSchemeIsActiveActions.Remove);
    } else {
      votingMachineParamsPropertyName = "voteParams";
    }
  }

  const schemeParams = (scheme as any)[`${schemeName}Params`][votingMachineParamsPropertyName];
  if (!schemeParams) {
    // eslint-disable-next-line no-console
    console.warn(` getSchemeIsActive: scheme parameters not found at "voteParams": ${scheme.name}`);
    return true;
  }
  if ((typeof(schemeParams.activationTime) === undefined) || (schemeParams.activationTime === null)) {
    // eslint-disable-next-line no-console
    console.warn(` getSchemeIsActive: voting machine appears not to be GenesisProtocol: ${scheme.name}`);
    return true;
  } else {
    return moment(schemeParams.activationTime*1000).isSameOrBefore(moment());
  }
}

/**
 * @param num The number to round
 * @param precision The number of decimal places to preserve
 */
export function roundUp(num: number, precision: number) {
  precision = Math.pow(10, precision);
  return Math.ceil(num * precision) / precision;
}

// error handler for ethereum subscriptions
export function ethErrorHandler() {
  const returnValueOnError: any = null; // return this when there is an error
  return catchError((err: any) => {
    // eslint-disable-next-line no-console
    console.error(err.message);
    return of(returnValueOnError);
  });
}

/**
 * @param arr The array to search
 * @param value The value to remove
 */
export function arrayRemove(arr: any[], value: any) {
  return arr.filter(function(ele){
    return ele !== value;
  });
}

const localTimezone = moment.tz.guess();

export function getDateWithTimezone(date: Date|moment.Moment): moment.Moment {
  return moment.tz(date.toISOString(), localTimezone);
}

const tzFormat = "z (Z)";
const dateFormat = `MMM DD, YYYY HH:mm ${tzFormat}`;
/**
 * looks like: "17:30 EST (-05:00) Dec 31, 2019"
 * @param date
 */
export function formatFriendlyDateForLocalTimezone(date: Date|moment.Moment): string {
  return getDateWithTimezone(date).format(dateFormat);
}
/**
 * looks like: "EST (-05:00)"
 */
export function getLocalTimezone(): string {
  return getDateWithTimezone(new Date()).format(tzFormat);
}

export function ensureHttps(url: string) {

  if (url) {
    const pattern = /^((http|https):\/\/)/;

    if(!pattern.test(url)) {
      url = "https://" + url;
    }
  }

  return url;
}

export function inTesting(): boolean {
  return (process.env.NODE_ENV === "development" && navigator.webdriver);
}
