/* eslint-disable no-bitwise */
import { // Address,
  IContractInfo,
  ISchemeState,
  Scheme,
} from "@daostack/arc.js";
import { rewarderContractName } from "components/Scheme/ContributionRewardExtRewarders/rewardersProps";
import { GenericSchemeRegistry } from "genericSchemeRegistry";

/**
 * gotta load moment in order to use moment-timezone directly
 */
import "moment";
import * as moment from "moment-timezone";

import { getArcByAddress, splitCamelCase } from "lib/util";

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
  "GenericSchemeMultiCall",
];

export const getKnownSchemes = (schemes: Scheme[]) => {
  return (schemes || []).filter((scheme: Scheme) => scheme.staticState.name !== "ContributionReward" && KNOWN_SCHEME_NAMES.indexOf(scheme.staticState.name) >= 0);
};

export const getUnknownSchemes = (schemes: Scheme[]) => {
  return (schemes || []).filter((scheme: Scheme) => scheme?.staticState?.name === "ContributionReward" || KNOWN_SCHEME_NAMES.indexOf(scheme.staticState.name) === -1);
};

export const PROPOSAL_SCHEME_NAMES = [
  "ContributionReward",
  "GenericScheme",
  "SchemeRegistrar",
  "UGenericScheme",
  "Competition",
  "ContributionRewardExt",
  "GenericSchemeMultiCall",
];

// /**
//  * return true if the address is the address of a known scheme (which we know how to represent)
//  * @param  address [description]
//  * @return         [description]
//  */
// export function isKnownScheme(address: Address) {
//   const arc = getArc();
//   let contractInfo;
//   try {
//     contractInfo = arc.getContractInfo(address);
//   } catch (err) {
//     if (err.message.match(/no contract/i)) {
//       return false;
//     }
//     throw err;
//   }

//   if (KNOWN_SCHEME_NAMES.includes(contractInfo.name)) {
//     return true;
//   } else {
//     return false;
//   }
// }

export function schemeName(scheme: ISchemeState|IContractInfo, fallback?: string) {
  let name: string;
  const contractInfo = (scheme as IContractInfo).alias ? scheme as IContractInfo : getArcByAddress(scheme.address)?.getContractInfo(scheme.address);

  const alias = contractInfo?.alias;

  if (scheme.name === "GenericScheme" || scheme.name === "UGenericScheme") {
    if (alias && ((alias !== "GenericScheme") && (alias !== "UGenericScheme"))) {
      name = alias;
    } else if ((scheme as any).genericSchemeParams || ((scheme as any).uGenericSchemeParams)) {
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
    if (alias && (alias !== "ContributionReward")) {
      name = alias;
    } else {
      name = "Funding and Voting Power";
    }
  } else if (scheme.name === "SchemeRegistrar") {
    if (alias && (alias !== "SchemeRegistrar")) {
      name = alias;
    } else {
      name = "Plugin Manager";
    }
  } else if (scheme.name) {
    if (scheme.name === "ContributionRewardExt") {
      /**
       * this will be "pretty"
       */
      name = rewarderContractName(scheme as ISchemeState, false);
    } else {
      name = alias ?? splitCamelCase(scheme.name);
    }
  } else {
    name = alias ?? fallback;
  }
  return name || scheme.name;
}

/**
 * given the address (of a scheme), return scheme's name
 * @param  address [description]
 * @return         [description]
 */
export function schemeNameFromAddress(address: string) {
  const arc = getArcByAddress(address);
  try {
    const contractInfo = arc.getContractInfo(address);
    const name = schemeName(contractInfo);
    return name;
  } catch (err) {
    if (err.message.match(/No contract/)) {
      return "";
    }
  }
}

/**
 * given the address (of a scheme), return  a friendly string represeting the scheme's address and it'sname
 * @param  address [description]
 * @return         [description]
 */
export function schemeNameAndAddress(address: string) {
  try {
    const name = schemeNameFromAddress(address);
    if (name !== "") {
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

/**
 * Returns true or false indicating whether the scheme is active and thus can accept new proposals.
 * @param scheme Required parameter that if undefined or null will cause this method to throw an exception.
 * @param action For SchemeRegistrar where we are asking specifically about Add and Remove actions.
 */
export function getSchemeIsActive(scheme: ISchemeState, action?: GetSchemeIsActiveActions): boolean {

  if (!scheme) {
    throw new Error("getSchemeIsActive: scheme parameter is not set");
  }

  let votingMachineParamsPropertyName: string;
  let schemeName = scheme.name ? `${scheme.name[0].toLowerCase()}${scheme.name.slice(1)}` : "";
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
    if (moment(votingMachineParams.activationTime*1000).isSameOrBefore(moment())) {
      return true;
    }
    // eslint-disable-next-line no-console
    console.warn(` getSchemeIsActive: future activation time: ${scheme.name}`);
    return false;
  }
}
