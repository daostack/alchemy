import { Address, IDAOState, IProposalState, IRewardState } from "@daostack/client";
import BN = require("bn.js");
import ReputationView from "components/Account/ReputationView";
import Util, { formatTokens, tokenSymbol } from "lib/util";
import * as React from "react";

interface IProps {
  beneficiaryHasRewards: boolean;
  currentAccountAddress: Address;
  dao: IDAOState;
  isRedeemPending: boolean;
  proposal: IProposalState;
  rewardsForCurrentUser: IRewardState[];
}

export default (props: IProps) => {
  const { beneficiaryHasRewards, currentAccountAddress, dao, isRedeemPending, proposal, rewardsForCurrentUser } = props;

  const rewardComponents = [];
  for (const reward of rewardsForCurrentUser) {
    let c = null;
    if (reward.reputationForProposer.gt(new BN(0))) {
      c = <div key={reward.id}>
          <strong>For creating the proposal you will receive:</strong>
          <ul>
            <li><ReputationView reputation={reward.reputationForProposer} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /></li>
          </ul>
        </div>;
      rewardComponents.push(c);
    } else if (reward.reputationForVoter.gt(new BN(0))) {
      c = <div key={reward.id}>
          <strong>For voting on the proposal you will receive:</strong>
          <ul>
            <li><ReputationView reputation={reward.reputationForVoter} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /></li>
          </ul>
        </div>;
      rewardComponents.push(c);
    }  else if (reward.tokensForStaker.gt(new BN(0))) {
      c = <div key={reward.id}>
        <strong>For staking on the proposal you will receive:</strong>
        <ul>
          <li>{Util.fromWei(reward.tokensForStaker)} GEN</li>
        </ul>
      </div>;
      rewardComponents.push(c);
    }  else if (reward.daoBountyForStaker.gt(new BN(0))) {
      c = <div key={reward.id}>
        <strong>For staking on the proposal you will receive:</strong>
        <ul>
          <li>{Util.fromWei(reward.daoBountyForStaker)} GEN bounty {dao.tokenBalance.lt(reward.daoBountyForStaker) ? " (Insufficient funds in DAO)" : ""}</li>
        </ul>
      </div >;
      rewardComponents.push(c);
    }

  }

  const contributionReward = proposal.contributionReward;

  const hasEthReward = contributionReward.ethReward.gt(new BN(0));
  const hasExternalReward = contributionReward.externalTokenReward.gt(new BN(0));
  const hasReputationReward = !contributionReward.reputationReward.isZero();

  return <div>
    {(beneficiaryHasRewards || hasEthReward || hasExternalReward) ?
      <div>
        <strong>
          {(currentAccountAddress === contributionReward.beneficiary) ?
              "As the" : "The"} beneficiary of the proposal {currentAccountAddress === contributionReward.beneficiary ? "you " : ""}will receive:
        </strong>
        <ul>
          {hasEthReward ?
            <li>
              {formatTokens(contributionReward.ethReward, "ETH")}
              {/*TODO: subscribe to ethBalance, {dao.ethBalance < contributionReward.ethReward ? " (Insufficient funds in DAO)" : ""}*/}
            </li> : ""
          }
          {hasExternalReward ?
            <li>
              {formatTokens(contributionReward.externalTokenReward, tokenSymbol(contributionReward.externalToken))}
              {/* TODO: should be looking at the DAO balance of proposal.externalToken
                {dao.externalTokenBalance && dao.externalTokenBalance.lt(proposal.externalTokenReward) ? " (Insufficient funds in DAO)" : ""}
              */}
            </li> : ""
          }
          {hasReputationReward ? <li><ReputationView reputation={contributionReward.reputationReward} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /></li> : ""}
        </ul>
      </div> : ""
    }
    <React.Fragment>
      { rewardComponents }
    </React.Fragment>

    {isRedeemPending ? <strong><i>Warning: Redeeming for this proposal is already in progress</i></strong> : ""}
  </div>;
};
