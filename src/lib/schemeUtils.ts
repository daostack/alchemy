/* eslint-disable no-bitwise */
import {
  Address,
  IContractInfo,
  ISchemeState} from "@daostack/arc.js";
import { rewarderContractName } from "components/Scheme/ContributionRewardExtRewarders/rewardersProps";
import { GenericSchemeRegistry } from "genericSchemeRegistry";

/**
 * gotta load moment in order to use moment-timezone directly
 */
import "moment";
import * as moment from "moment-timezone";

import { getArc } from "../arc";

export enum SchemePermissions {
  None = 0,
  IsRegistered = 1, // Always added by default in the controller
  CanRegisterSchemes = 2,
  CanAddRemoveGlobalConstraints = 4,
  CanUpgradeController = 8,
  CanCallDelegateCall = 0x10,
  All = 0x1f,
}

/**
 * These are the permissions that are the minimum that each scheme must have to
 * be able to perform its full range of functionality.
 *
 * Note that '1' is always assigned to a scheme by the Controller when the
 * scheme is registered with the controller.
 */
export const REQUIRED_SCHEME_PERMISSIONS: any = {
  "ContributionReward": SchemePermissions.IsRegistered,
  "GlobalConstraintRegistrar": SchemePermissions.IsRegistered | SchemePermissions.CanAddRemoveGlobalConstraints,
  "SchemeRegistrar": SchemePermissions.All, // TODO: is this correct?
  "UpgradeScheme": SchemePermissions.IsRegistered | SchemePermissions.CanRegisterSchemes | SchemePermissions.CanUpgradeController,
  "VestingScheme": SchemePermissions.IsRegistered,
  "VoteInOrganizationScheme": SchemePermissions.IsRegistered | SchemePermissions.CanCallDelegateCall,
};

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
    name ="Scheme Manager";
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

export enum GetSchemeIsActiveActions {
  Register=1,
  Remove
}

const schemeActionPropNames = new Map<string, Map<GetSchemeIsActiveActions, string>>([
  [
    "SchemeRegistrar", new Map<GetSchemeIsActiveActions, string>([
      [GetSchemeIsActiveActions.Register, "voteRegisterParams"],
      [GetSchemeIsActiveActions.Remove, "voteRemoveParams"],
    ]),
  ],
]);

export function getSchemeIsActive(scheme: ISchemeState, action?: GetSchemeIsActiveActions): boolean {
  let votingMachineParamsPropertyName: string;
  let schemeName = scheme.name ? `${scheme.name[0].toLowerCase()}${scheme.name.slice(1)}` : "";

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

  const schemeParams = (scheme as any)[`${schemeName}Params`];
  if (!schemeParams) {
    // eslint-disable-next-line no-console
    console.warn(` getSchemeIsActive: scheme parameters not found for ${scheme.name}`);
    return true;
  }
  const votingMachineParams = schemeParams[votingMachineParamsPropertyName];
  if (!votingMachineParams) {
    // eslint-disable-next-line no-console
    console.warn(` getSchemeIsActive: voting machine parameters parameters not found for ${scheme.name}`);
    return true;
  }
  if ((typeof(votingMachineParams.activationTime) === undefined) || (votingMachineParams.activationTime === null)) {
    // eslint-disable-next-line no-console
    console.warn(` getSchemeIsActive: voting machine appears not to be GenesisProtocol: ${scheme.name}`);
    return true;
  } else {
    return moment(votingMachineParams.activationTime*1000).isSameOrBefore(moment());
  }
}
