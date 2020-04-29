import { ISchemeState } from "@daostack/arc.js";
import { getArc } from "arc";

export const hasRewarderContract = (schemeState: ISchemeState): boolean => {
  return !!schemeState.contributionRewardExtParams && !!schemeState.contributionRewardExtParams.rewarder;
};

export const rewarderContractName = (schemeState: ISchemeState): string => {
  if (hasRewarderContract(schemeState)) {
    const contractInfo = getArc().getContractInfo(schemeState.contributionRewardExtParams.rewarder);
    if (contractInfo) {
      return contractInfo.name;
    } else {
      // eslint-disable-next-line no-console
      console.error(`rewarder contract not found: ${schemeState.contributionRewardExtParams.rewarder}`);
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
 * If the scheme is a ContributionRewardExt, return props for its rewarder contract, if any
 * @param scheme 
 */
export const getCrxRewarderProps = (scheme: ISchemeState): Promise<ICrxRewarderProps> | null  => {
  const contractName = rewarderContractName(scheme);
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
 * with the given CrExt scheme.
 */
export const getCrxRewarderComponent = (schemeState: ISchemeState, type: CrxRewarderComponentType): Promise<any> => {
  const contractName = rewarderContractName(schemeState);
  if (contractName) {
    return import(`components/Scheme/ContributionRewardExtRewarders/${contractName}/${CrxRewarderComponentType[type]}`)
      .then(module => module.default);
  } else {
    return null;
  }
};
