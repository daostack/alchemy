import { Address, IDAOState, IProposalState, IRewardState } from "@daostack/client";
import BN = require("bn.js");
import ReputationView from "components/Account/ReputationView";
import { formatTokens } from "lib/util";
import * as React from "react";

interface IProps {
  isRedeemPending: boolean;
  beneficiaryHasRewards: boolean;
  currentAccountAddress: Address;
  dao: IDAOState;
  executable: boolean;
  accountHasRewards: boolean;
  proposal: IProposalState;
  redeemable: boolean;
  rewards: IRewardState[];
}

export default (props: IProps) => {
  const { proposal, currentAccountAddress, dao, executable, beneficiaryHasRewards, isRedeemPending, rewards } = props;

  const rewardComponents = [];
  for (const reward of rewards) {
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
          <li>{reward.tokensForStaker} GEN</li>
        </ul>
      </div>;
      rewardComponents.push(c);
    }  else if (reward.daoBountyForStaker.gt(new BN(0))) {
      c = <div key={reward.id}>
        <strong>For staking on the proposal you will receive:</strong>
        <ul>
          <li>{reward.daoBountyForStaker} GEN bounty {dao.tokenBalance.lt(reward.daoBountyForStaker) ? " (Insufficient funds in DAO)" : ""}</li>
        </ul>
      </div >;
      rewardComponents.push(c);
    }

  }

  const hasEthReward = proposal.ethReward.gt(new BN(0));
  const hasExternalReward = proposal.externalTokenReward.gt(new BN(0));
  const hasReputationReward = proposal.reputationReward.gt(new BN(0));

  return <div>
    {(props.beneficiaryHasRewards || hasEthReward || hasExternalReward) ?
      <div>
        <strong>
          {(currentAccountAddress === proposal.beneficiary) ?
              "As the" : "The"} beneficiary of the proposal {currentAccountAddress === proposal.beneficiary ? "you " : ""}will receive:
        </strong>
        <ul>
          {hasEthReward ?
            <li>
              {formatTokens(proposal.ethReward, "ETH")}
              {/*TODO: subscribe to ethBalance, {dao.ethBalance < proposal.ethReward ? " (Insufficient funds in DAO)" : ""}*/}
            </li> : ""
          }
          {hasExternalReward ?
            <li>
              {formatTokens(proposal.externalTokenReward, dao.externalTokenSymbol)}
              {dao.externalTokenBalance && dao.externalTokenBalance.lt(proposal.externalTokenReward) ? " (Insufficient funds in DAO)" : ""}
            </li> : ""
          }
          {hasReputationReward ? <li><ReputationView reputation={proposal.reputationReward} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /></li> : ""}
        </ul>
      </div> : ""
    }
    <React.Fragment>
      { rewardComponents }
    </React.Fragment>

    {isRedeemPending ? <strong><i>Warning: Redeeming for this proposal is already in progress</i></strong> : ""}
  </div>;
};
