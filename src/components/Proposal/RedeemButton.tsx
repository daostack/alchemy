import * as classNames from "classnames";
import * as css from "./Proposal.scss";
import Tooltip from 'rc-tooltip';
import * as React from "react";
import RedemptionsTip from './RedemptionsTip'
import { IAccountState, IRedemptionState, IStakeState, IVoteState, VoteOptions, closingTime, newAccount } from "reducers/arcReducer";
import { IDAOState, IProposalState, ProposalStage } from '@daostack/client'

interface IProps {
  accountHasRewards: boolean
  isRedeemPending: boolean
  redeemable: boolean
  executable: boolean
  beneficiaryHasRewards: boolean
  currentRedemptions: IRedemptionState
  currentAccount: IAccountState
  dao: IDAOState
  proposal: IProposalState
  handleClickRedeem: any
}

const RedeemButton = (props: IProps) => {
  const { isRedeemPending, redeemable, executable, beneficiaryHasRewards,
    currentRedemptions, accountHasRewards, handleClickRedeem } = props
  const redemptionsTip = RedemptionsTip(props)

  const redeemRewards = classNames({
    [css.redeemRewards]: true,
    [css.pending]: isRedeemPending,
    [css.disabled]: !redeemable && !executable
  });

  return (currentRedemptions || beneficiaryHasRewards || executable ?
    <Tooltip placement="left" trigger={["hover"]} overlay={redemptionsTip}>
      <button
        style={{ whiteSpace: 'nowrap' }}
        disabled={false}
        className={redeemRewards}
        onClick={handleClickRedeem}
      >
        {
          isRedeemPending ?
            'Redeem in progress' :
            beneficiaryHasRewards && !accountHasRewards ?
              'Redeem for beneficiary' :
              currentRedemptions ?
                'Redeem' :
                'Execute'
        }
        <img src="/assets/images/Icon/Loading-black.svg" />
      </button>
    </Tooltip>
    : "");
}

export default RedeemButton
