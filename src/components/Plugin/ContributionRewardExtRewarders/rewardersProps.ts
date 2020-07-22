import { IContributionRewardExtState, CompetitionProposal, Arc } from "@daostack/arc.js";
import { getArc } from "arc";
import { splitCamelCase } from "lib/util";

export const hasRewarderContract = (pluginState: IContributionRewardExtState): boolean => {
  return !!pluginState.pluginParams && !!pluginState.pluginParams.rewarder;
};

export const rewarderContractName = (pluginState: IContributionRewardExtState, useAlias = true): string => {
  try {
    if (hasRewarderContract(pluginState)) {
      const contractInfo = getArc().getContractInfo(pluginState.pluginParams.rewarder);
      if (contractInfo) {
        return (useAlias && !!contractInfo.alias) ? contractInfo.alias : splitCamelCase(contractInfo.name);
      } else {
        // eslint-disable-next-line no-console
        console.error(`rewarder contract not found: ${pluginState.pluginParams.rewarder}`);
      }
    }
  }
  catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }

  return null;
};

export interface ICrxRewarderProps {
  friendlyName: string;
  contractName: string;
  shortDescription: string;
  // description: string;
}

/**
 * If the plugin is a ContributionRewardExt, return props for its rewarder contract, if any
 * @param plugin
 */
export const getCrxRewarderProps = (pluginState: IContributionRewardExtState): Promise<ICrxRewarderProps> | null => {
  const contractName = rewarderContractName(pluginState, false);
  // dynamic imports are enabled and optimized by @babel/plugin-syntax-dynamic-import
  return contractName ? import(`./${contractName}/props.json`) : null;
};

export enum CrxRewarderComponentType {
  List,
  Details,
  CreateProposal
}
/**
 * Return the component of the given type that is supplied by the rewarder contract associated
 * with the given CrExt plugin.
 */
export const getCrxRewarderComponent = (pluginState: IContributionRewardExtState, type: CrxRewarderComponentType): Promise<any> => {
  const contractName = rewarderContractName(pluginState, false);
  if (contractName) {
    return import(`components/Plugin/ContributionRewardExtRewarders/${contractName}/${CrxRewarderComponentType[type]}`)
      .then(module => module.default);
  } else {
    return null;
  }
};

/**
 * defined but not exported by arc.js
 */
export interface IEntityState {
  id: string;
}

/**
 * Returns the arc.js class representing proposals created by given plugin.
 * Returns `null` if the plugin has no rewarder or the rewarder contract is not known to
 * arc.js.
 * @param pluginState
 */
export const getCrxRewarderProposalClass =
  (pluginState: IContributionRewardExtState): new (context: Arc, idOrOpts: string | IEntityState) => any => {

    switch (rewarderContractName(pluginState, false)) {
      case "Competition":
        return CompetitionProposal;
      default:
        return null;
    }
  };
