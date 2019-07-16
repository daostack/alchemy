import { Address, IDAOState, IProposalState, IRewardState } from "@daostack/client";
import ReputationView from "components/Account/ReputationView";
import { claimableContributionRewards, formatTokens, fromWei, getClaimableRewards, tokenSymbol } from "lib/util";
import * as React from "react";

interface IProps {
  beneficiaryHasRewards: boolean;
  currentAccountAddress: Address;
  dao: IDAOState;
  proposal: IProposalState;
  rewardsForCurrentUser: IRewardState;
}

export default (props: IProps) => {
  const { currentAccountAddress, dao, proposal, rewardsForCurrentUser } = props;

  const rewardComponents = [];
  // rewards of current user
  const claimableRewards = getClaimableRewards(rewardsForCurrentUser);
  let c = null;
  if (claimableRewards.reputationForProposer) {
    c = <div key={rewardsForCurrentUser.id}>
        <strong>For creating the proposal you will receive:</strong>
        <ul>
          <li><ReputationView reputation={claimableRewards.reputationForProposer} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /></li>
        </ul>
      </div>;
    rewardComponents.push(c);
  }
  if (claimableRewards.reputationForVoter) {
    c = <div key={rewardsForCurrentUser.id}>
        <strong>For voting on the proposal you will receive:</strong>
        <ul>
          <li><ReputationView reputation={claimableRewards.reputationForVoter} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /></li>
        </ul>
      </div>;
    rewardComponents.push(c);
  }
  if (claimableRewards.tokensForStaker) {
    c = <div key={rewardsForCurrentUser.id}>
      <strong>For staking on the proposal you will receive:</strong>
      <ul>
        <li>{fromWei(claimableRewards.tokensForStaker)} GEN</li>
      </ul>
    </div>;
    rewardComponents.push(c);
  }
  if (claimableRewards.daoBountyForStaker) {
    c = <div key={rewardsForCurrentUser.id}>
      <strong>For staking on the proposal you will receive:</strong>
      <ul>
        <li>{fromWei(claimableRewards.daoBountyForStaker)} bounty from the DAO (if the DAO has enough GEN)
        </li>
      </ul>
    </div >;
    rewardComponents.push(c);
  }

  const contributionReward = proposal.contributionReward;

  let ContributionRewardDiv = <div />;
  if (proposal.contributionReward) {
    const contributionRewards = claimableContributionRewards(contributionReward);
    // const hasEthReward = contributionReward.ethReward.gt(new BN(0));
    // const hasExternalReward = contributionReward.externalTokenReward.gt(new BN(0));
    // const hasReputationReward = !contributionReward.reputationReward.isZero();
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
          {contributionRewards["rep"] ? <li><ReputationView reputation={contributionRewards["rep"]} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /></li> : ""}
          { /*
            TOOD: add native token
          */ }
        </ul>
      </div>;
    }

  }

  return <div>
    <React.Fragment>
      { rewardComponents }
    </React.Fragment>
    { ContributionRewardDiv }
  </div>;
};
