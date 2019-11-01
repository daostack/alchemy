import { Address, IDAOState, IProposalState, IProposalOutcome, IRewardState } from "@daostack/client";
import Reputation from "components/Account/Reputation";
import { getCRRewards, formatTokens, fromWei, getGpRewards, tokenSymbol } from "lib/util";
import * as React from "react";

interface IProps {
  currentAccountAddress: Address;
  dao: IDAOState;
  proposal: IProposalState;
  gpRewardsForCurrentUser: IRewardState;
}

export default (props: IProps) => {
  const { currentAccountAddress, dao, proposal, gpRewardsForCurrentUser: rewardsForCurrentUser } = props;

  const rewardComponents = [];
  // non-zero GP rewards of current user, payable or not
  const gpRewards = getGpRewards(rewardsForCurrentUser);
  let c = null;
  if (gpRewards.reputationForProposer) {
    c = <div key={rewardsForCurrentUser.id + "_proposer"}>
      <strong>For creating the proposal you will receive:</strong>
      <ul>
        <li><Reputation reputation={gpRewards.reputationForProposer} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /></li>
      </ul>
    </div>;
    rewardComponents.push(c);
  }
  if (gpRewards.reputationForVoter) {
    c = <div key={rewardsForCurrentUser.id + "_voter"}>
      <strong>For voting on the proposal you will receive:</strong>
      <ul>
        <li><Reputation reputation={gpRewards.reputationForVoter} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /></li>
      </ul>
    </div>;
    rewardComponents.push(c);
  }
  if (gpRewards.tokensForStaker) {
    c = <div key={rewardsForCurrentUser.id + "_staker_tokens"}>
      <strong>For staking on the proposal you will receive:</strong>
      <ul>
        <li>{fromWei(gpRewards.tokensForStaker)} GEN</li>
      </ul>
    </div>;
    rewardComponents.push(c);
  }
  if (gpRewards.daoBountyForStaker) {
    c = <div key={rewardsForCurrentUser.id + "_staker_bounty"}>
      <strong>For staking on the proposal you will receive:</strong>
      <ul>
        <li>{fromWei(gpRewards.daoBountyForStaker)} bounty from the DAO
        </li>
      </ul>
    </div >;
    rewardComponents.push(c);
  }

  const contributionReward = proposal.contributionReward;

  let ContributionRewardDiv = <div />;
  if (proposal.winningOutcome === IProposalOutcome.Pass && proposal.contributionReward) {
    const contributionRewards = getCRRewards(contributionReward);
    if (Object.keys(contributionRewards).length > 0) {
      ContributionRewardDiv = <div>
        <strong>
          {(currentAccountAddress && currentAccountAddress === contributionReward.beneficiary.toLowerCase()) ?
            "As the beneficiary of the proposal you will recieve" :
            "The beneficiary of the proposal will receive"}
        </strong>
        <ul>
          {contributionRewards["eth"]  ?
            <li>
              {formatTokens(contributionReward.ethReward, "ETH")}
            </li> : ""
          }
          {contributionRewards["externalToken"] ?
            <li>
              {formatTokens(contributionRewards["externalToken"], tokenSymbol(contributionReward.externalToken))}
            </li> : ""
          }
          {contributionRewards["rep"] ? <li><Reputation reputation={contributionRewards["rep"]} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /></li> : ""}

          {contributionRewards["nativeToken"] ?
            <li>
              {formatTokens(contributionRewards["nativeToken"], dao.tokenSymbol)}
            </li> : ""
          }

        </ul>
      </div>;
    }

  }

  return <div style={{ paddingTop: "8px" }}>
    <React.Fragment>
      { rewardComponents }
    </React.Fragment>
    { ContributionRewardDiv }
  </div>;
};
