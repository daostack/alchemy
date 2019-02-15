import { IDAOState, IMemberState, IProposalState, IRewardState, RewardReason, RewardType } from "@daostack/client"
import ReputationView from "components/Account/ReputationView";
import * as React from "react";

interface IProps {
  isRedeemPending: boolean
  beneficiaryHasRewards: boolean
  currentAccount: IMemberState
  dao: IDAOState
  executable: boolean
  accountHasRewards: boolean
  proposal: IProposalState
  redeemable: boolean
  rewards: IRewardState[]
}

export default (props: IProps) => {
  const { proposal, currentAccount, dao, executable, beneficiaryHasRewards, isRedeemPending, rewards } = props

  const rewardComponents = []
  for (const reward of rewards) {
    let c = null
    if (reward.reason === RewardReason.Proposer && reward.type === RewardType.Reputation) {
      c = <div>
          <strong>For creating the proposal you will receive:</strong>
          <ul>
            <li><ReputationView reputation={reward.amount} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /></li>
          </ul>
        </div>
    } else if (reward.reason === RewardReason.Voter && reward.type === RewardType.Reputation) {
      c = <div>
          <strong>For voting on the proposal you will receive:</strong>
          <ul>
            <li><ReputationView reputation={reward.amount} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /></li>
          </ul>
        </div>
    } else if (reward.reason === RewardReason.Voter && reward.type === RewardType.Token) {
      c = <div>
          <strong>For voting on the proposal you will receive:</strong>
          <ul>
            <li>{reward.amount} GEN</li>
          </ul>
        </div>
    }  else if (reward.reason === RewardReason.Staker && reward.type === RewardType.Token) {
      c = <div>
        <strong>For staking on the proposal you will receive:</strong>
        <ul>
          <li>{reward.amount} GEN</li>
        </ul>
      </div>
    }  else if (reward.reason === RewardReason.Staker && reward.type === RewardType.Reputation) {
      c = <div>
        <strong>For staking on the proposal you will receive:</strong>
        <ul>
          <li><ReputationView reputation={reward.amount} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /></li>
        </ul>
      </div>
    }  else if (reward.reason === RewardReason.Bounty && reward.type === RewardType.Token) {
      c = <div>
        <strong>For staking on the proposal you will receive:</strong>
        <ul>
          <li>{reward.amount} GEN bounty {dao.tokenBalance < reward.amount ? " (Insufficient funds in DAO)" : ""}</li>
        </ul>
      </div >
    }

    if (c) { rewardComponents.push(c) }
  }
  return <div>
    {(props.beneficiaryHasRewards || proposal.ethReward || proposal.externalTokenReward) ?
      <div>
        <strong>
          {currentAccount.address === proposal.beneficiary ? "As the" : "The"} beneficiary of the proposal {currentAccount.address === proposal.beneficiary ? "you " : ""}will receive:
        </strong>
        <ul>
          {proposal.ethReward ?
            <li>
              {proposal.ethReward} ETH
              {dao.ethBalance < proposal.ethReward ? " (Insufficient funds in DAO)" : ""}
            </li> : ""
          }
          {proposal.externalTokenReward ?
            <li>
              {proposal.externalTokenReward} {dao.externalTokenSymbol}
              {dao.externalTokenBalance < proposal.externalTokenReward ? " (Insufficient funds in DAO)" : ""}
            </li> : ""
          }
          {proposal.reputationReward ? <li><ReputationView reputation={proposal.reputationReward} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /></li> : ""}
        </ul>
      </div> : ""
    }
      <React.Fragment>
        {proposal.proposingRepReward ?
          <div>
            <strong>For creating the proposal you will receive:</strong>
            <ul>
              <li><ReputationView reputation={proposal.proposingRepReward} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /></li>
            </ul>
          </div> : ""
        }
        { rewardComponents }
    </React.Fragment>

    {rewards.length === 0 && !beneficiaryHasRewards && executable ?
      <span>Executing a proposal ensures that the target of the proposal receives their reward or punishment.</span>
      : ""
    }
    {isRedeemPending ? <strong><i>Warning: Redeeming for this proposal is already in progress</i></strong> : ""}
  </div>
}
