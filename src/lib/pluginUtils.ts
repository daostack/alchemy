/* eslint-disable no-bitwise */
import {
  Address,
  IContractInfo,
  IPluginState,
  IGenericPluginState,
  IContributionRewardExtState,
} from "@daostack/arc.js";
import { rewarderContractName } from "components/Plugin/ContributionRewardExtRewarders/rewardersProps";
import { GenericPluginRegistry } from "genericPluginRegistry";

/**
 * gotta load moment in order to use moment-timezone directly
 */
import "moment";
import * as moment from "moment-timezone";

import { getArc } from "../arc";
import { splitCamelCase } from "lib/util";

export enum PluginPermissions {
  None = 0,
  IsRegistered = 1, // Always added by default in the controller
  CanRegisterPlugins = 2,
  CanAddRemoveGlobalConstraints = 4,
  CanUpgradeController = 8,
  CanCallDelegateCall = 0x10,
  All = 0x1f,
}

/**
 * These are the permissions that are the minimum that each plugin must have to
 * be able to perform its full range of functionality.
 *
 * Note that '1' is always assigned to a plugin by the Controller when the
 * plugin is registered with the controller.
 */
export const REQUIRED_PLUGIN_PERMISSIONS: any = {
  "ContributionReward": PluginPermissions.IsRegistered,
  "GlobalConstraintRegistrar": PluginPermissions.IsRegistered | PluginPermissions.CanAddRemoveGlobalConstraints,
  "SchemeRegistrar": PluginPermissions.All, // TODO: is this correct?
  "SchemeFactory": PluginPermissions.All, //TODO: is this correct?
  "UpgradeScheme": PluginPermissions.IsRegistered | PluginPermissions.CanRegisterPlugins | PluginPermissions.CanUpgradeController,
  "VestingScheme": PluginPermissions.IsRegistered,
  "VoteInOrganizationScheme": PluginPermissions.IsRegistered | PluginPermissions.CanCallDelegateCall,
};

/** plugins that we know how to interpret  */
export const PLUGIN_NAMES = {
  ContributionReward: "Funding and Voting Power",
  GenericScheme: "Generic Plugin",
  ReputationFromToken: "Reputation from Token",
  SchemeRegistrar: "Plugin Registrar",
  SchemeFactory: "Plugin Manager",
  Competition: "Competition",
  ContributionRewardExt: "Contribution Reward Ext",
};

/**
 * return true if the address is the address of a known plugin (which we know how to represent)
 * @param  address [description]
 * @return         [description]
 */
export function isKnownPlugin(address: Address) {
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

  if (Object.keys(PLUGIN_NAMES).includes(contractInfo.name)) {
    return true;
  } else {
    return false;
  }
}

export function pluginName(plugin: IPluginState|IContractInfo, fallback?: string) {
  let name: string;
  if (plugin.name === "GenericScheme") {
    const generic = plugin as IGenericPluginState;
    if (generic.pluginParams && generic.pluginParams.contractToCall) {
      const genericPluginRegistry = new GenericPluginRegistry();
      const contractToCall = generic.pluginParams.contractToCall;
      const genericPluginInfo = genericPluginRegistry.getPluginInfo(contractToCall);
      if (genericPluginInfo) {
        name = genericPluginInfo.specs.name;
      } else {
        // Adding the address is a bit long for a title
        // name = `Blockchain Interaction (${contractToCall})`;
        name = "Blockchain Interaction";
      }
    } else {
      // this should never happen...
      name = "Blockchain Interaction";
    }
  } else if (plugin.name === "ContributionRewardExt") {
    name = rewarderContractName(plugin as IContributionRewardExtState);

    if (!name) {
      name = "ContributionRewardExt";
    } else {
      // add spaces before capital letters to approximate a human-readable title
      name = splitCamelCase(name);
    }
  } else {
    name = PLUGIN_NAMES[plugin.name as keyof typeof PLUGIN_NAMES];
    if (name === undefined){
      name = fallback;
    }
  }
  return name;
}

/**
 * Given plugin name and address, returns a friendly string representing the plugin's address and it's name
 * @param name
 * @param address
 */
function getNameAndAddressString(address: string, name?: string) {
  if (name) {
    return `${address.slice(0, 4)}...${address.slice(-4)} (${name})`;
  }
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/**
 * Given a plugin or a plugin address, returns a friendly string representing the plugin's address and it's name
 * @param plugin plugin or plugin address
 */
export function pluginNameAndAddress(plugin: string|IPluginState) {
  let name;
  if (typeof plugin === "string"){ // Plugin address
    const arc = getArc();
    try {
      const contractInfo = arc.getContractInfo(plugin);
      name = pluginName(contractInfo);
      if (name) {
        return getNameAndAddressString(plugin, name);
      }
      return getNameAndAddressString(plugin);
    } catch (err) {
      if (err.message.match(/No contract/)) {
        return getNameAndAddressString(plugin);
      }
    }
  }
  else { // Plugin
    name = pluginName(plugin);
    return getNameAndAddressString(plugin.address, name);
  }
}

export enum GetPluginIsActiveActions {
  Register=1,
  Remove,
  Replace
}

const pluginActionPropNames = new Map<string, Map<GetPluginIsActiveActions, string>>([
  [
    "SchemeRegistrar", new Map<GetPluginIsActiveActions, string>([
      [GetPluginIsActiveActions.Register, "voteRegisterParams"],
      [GetPluginIsActiveActions.Remove, "voteRemoveParams"],
    ]),
  ],
  [
    "SchemeFactory", new Map<GetPluginIsActiveActions, string>([
      [GetPluginIsActiveActions.Register, "voteParams"],
      [GetPluginIsActiveActions.Remove, "voteParams"],
      [GetPluginIsActiveActions.Replace, "voteParams"],
    ]),
  ],
]);

export function getPluginIsActive(plugin: IPluginState, action?: GetPluginIsActiveActions): boolean {
  let votingMachineParamsPropertyName: string;

  if (action) { // then the name of the voting machine properties property depends on the action
    const pluginActionsMap = pluginActionPropNames.get(plugin.name);

    if (!pluginActionsMap) {
      throw new Error(`getPluginIsActive: unknown plugin: ${plugin.name}`);
    }
    const propName = pluginActionsMap.get(action);
    if (!propName) {
      throw new Error(`getPluginIsActive: unknown action: ${plugin.name}:${action}`);
    }
    votingMachineParamsPropertyName = propName;
  } else {
    /**
     * if plugin is SchemeRegistrar, then it is active if any of its actions are active
     */
    if (plugin.name === "SchemeRegistrar") {
      return getPluginIsActive(plugin, GetPluginIsActiveActions.Register) || getPluginIsActive(plugin, GetPluginIsActiveActions.Remove);
    } else {
      votingMachineParamsPropertyName = "voteParams";
    }
  }

  const votingMachineParams = (plugin as any).pluginParams[votingMachineParamsPropertyName];

  if (!votingMachineParams) {
    // eslint-disable-next-line no-console
    console.warn(` getPluginIsActive: voting machine parameters parameters not found for ${plugin.name}`);
    return true;
  }
  if ((typeof(votingMachineParams.activationTime) === undefined) || (votingMachineParams.activationTime === null)) {
    // eslint-disable-next-line no-console
    console.warn(` getPluginIsActive: voting machine appears not to be GenesisProtocol: ${plugin.name}`);
    return true;
  } else {
    return moment(votingMachineParams.activationTime*1000).isSameOrBefore(moment());
  }
}
