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
import moment = require("moment");

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
];

export const PROPOSAL_SCHEME_NAMES = [
  "ContributionReward",
  "GenericScheme",
  "SchemeRegistrar",
  "UGenericScheme",
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
export function getCRRewards(reward: IContributionReward, daoBalances: { [key: string]: BN } = {}): AccountClaimableRewardsType {
  const result: AccountClaimableRewardsType = {};
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

export function isValidUrl(str: string, emptyOk = true): boolean {
  return (emptyOk && (!str || !str.trim())) || (str && pattern.test(str));
}

export function isMobileBrowser(): boolean {
  let check = false;
  // from here: http://detectmobilebrowsers.com/
  // eslint-disable-next-line no-useless-escape
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true; })(navigator.userAgent||navigator.vendor||(window as any).opera);
  return check;
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
    return moment(schemeParams.activationTime).isSameOrBefore(moment());
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
