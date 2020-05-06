import { IContributionRewardExtState } from "@daostack/arc.js";
import { getArc } from "arc";

export const hasRewarderContract = (pluginState: IContributionRewardExtState): boolean => {
  return !!pluginState.pluginParams && !!pluginState.pluginParams.rewarder;
};

export const rewarderContractName = (pluginState: IContributionRewardExtState): string => {
  if (hasRewarderContract(pluginState)) {
    const contractInfo = getArc().getContractInfo(pluginState.pluginParams.rewarder);
    if (contractInfo) {
      return contractInfo.name;
    } else {
      // eslint-disable-next-line no-console
      console.error(`rewarder contract not found: ${pluginState.pluginParams.rewarder}`);
    }
  }
  return null;
};

export interface ICrxRewarderProps
{
  friendlyName: string;
  contractName: string;
  shortDescription: string;
  // description: string;
}

/**
 * If the plugin is a ContributionRewardExt, return props for its rewarder contract, if any
 * @param plugin
 */
export const getCrxRewarderProps = (pluginState: IContributionRewardExtState): Promise<ICrxRewarderProps> | null  => {
  const contractName = rewarderContractName(pluginState);
  // dynamic imports are enabled and optimized by @babel/plugin-syntax-dynamic-import
  return contractName ?  import(`./${contractName}/props.json`) : null;
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
  const contractName = rewarderContractName(pluginState);
  if (contractName) {
    return import(`components/Plugin/ContributionRewardExtRewarders/${contractName}/${CrxRewarderComponentType[type]}`)
      .then(module => module.default);
  } else {
    return null;
  }
};
