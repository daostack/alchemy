import { IDAOState, IProposalState, IRewardState, ProposalStage } from '@daostack/client'
import ReputationView from "components/Account/ReputationView";
import * as React from "react";
import { IAccountState, IRedemptionState, IStakeState, IVoteState, newAccount, VoteOptions } from "reducers/arcReducer";

interface IProps {
  isRedeemPending: boolean
  beneficiaryHasRewards: boolean
  currentAccount: IAccountState;
  dao: IDAOState
  executable: boolean
  accountHasRewards: boolean
  currentRedemptions: IRedemptionState
  proposal: IProposalState
  redeemable: boolean
  rewards: IRewardState[]
}
export default (props: IProps) => {
  const { proposal, currentAccount, dao, executable, beneficiaryHasRewards, isRedeemPending, currentRedemptions, rewards } = props

  const rewardComponents = []
  for (const reward of rewards) {
    rewardComponents.push(<div>
      {reward.id}
    </div>)
  }
  return <div>
    {(props.beneficiaryHasRewards || proposal.ethReward || proposal.externalTokenReward) ?
      <div>
        <strong>
          {currentAccount.address === proposal.beneficiary ? 'As the' : 'The'} beneficiary of the proposal {currentAccount.address === proposal.beneficiary ? 'you ' : ''}will receive:
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
        {currentRedemptions.voterReputation || currentRedemptions.voterTokens ?
          <div>
            <strong>For voting on the proposal you will receive:</strong>
            <ul>
              {currentRedemptions.voterReputation ? <li><ReputationView reputation={currentRedemptions.voterReputation} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /></li> : ""}
              {currentRedemptions.voterTokens ? <li>{currentRedemptions.voterTokens} GEN</li> : ""}
            </ul>
          </div> : ""
        }
        {currentRedemptions.stakerTokens || currentRedemptions.stakerBountyTokens || currentRedemptions.stakerReputation ?
          <div>
            <strong>For staking on the proposal you will receive:</strong>
            <ul>
              {currentRedemptions.stakerTokens ? <li>{currentRedemptions.stakerTokens} GEN</li> : ""}
              {currentRedemptions.stakerBountyTokens ?
                <li>
                  {currentRedemptions.stakerBountyTokens} GEN bounty
                  {dao.tokenBalance < currentRedemptions.stakerBountyTokens ? " (Insufficient funds in DAO)" : ""}
                </li> : ""
              }
              {currentRedemptions.stakerReputation ? <li><ReputationView reputation={currentRedemptions.stakerReputation} totalReputation={dao.reputationTotalSupply} daoName={dao.name} /></li> : ""}
            </ul>
          </div> : ""
        }
      </React.Fragment>

    {rewards.length === 0 && !beneficiaryHasRewards && executable ?
      <span>Executing a proposal ensures that the target of the proposal receives their reward or punishment.</span>
      : ''
    }
    {isRedeemPending ? <strong><i>Warning: Redeeming for this proposal is already in progress</i></strong> : ''}
  </div>
}
