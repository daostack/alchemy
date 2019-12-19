import { Address, ISchemeStaticState } from "@daostack/client";
// import { getNetworkName } from "lib/util";

// const registryLookupInfo = require("./schemes/rewarders.json");

// FAKE:  include ContributionRewardExt (static) state here?
export interface ICrxRewarderProps
{
  address: Address;
  friendlyName: string;
  contractName: string;
  shortDescription: string;
  // description: string;
}

/**
 * If the scheme is a ContributionRewardExt, return configuration of its rewarder contract, if any
 * @param scheme 
 */
export const getCrxRewarderConfig = (scheme: ISchemeStaticState): ICrxRewarderProps | null  => {
  // FAKE -- will get this from the JSON file and the scheme's rewarder address, if present
  //const networkName = getNetworkName();
  if (scheme.name === "ContributionReward" || scheme.name === "ContributionRewardExt") {
    return {
      address: scheme.address,
      contractName: "Competition",
      friendlyName: "Competitions",
      shortDescription: "Work with approved competitions",
    };
  }
  return null;  
};
