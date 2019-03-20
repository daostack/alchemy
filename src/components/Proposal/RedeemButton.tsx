import { Address, IDAOState, IProposalState, IRewardState } from "@daostack/client";
import * as classNames from "classnames";
import Tooltip from "rc-tooltip";
import * as React from "react";
import * as css from "./Proposal.scss";
import RedemptionsTip from "./RedemptionsTip";

interface IProps {
  accountHasRewards: boolean;
  isRedeemPending: boolean;
  redeemable: boolean;
  executable: boolean;
  beneficiaryHasRewards: boolean;
  currentAccountAddress: Address;
  dao: IDAOState;
  proposal: IProposalState;
  handleClickRedeem: any;
  rewards: IRewardState[];
}

class RedeemButton extends React.Component<IProps> {
  public render() {
    const {
      isRedeemPending,
      redeemable,
      executable,
      beneficiaryHasRewards,
      accountHasRewards,
      handleClickRedeem,
      rewards
    } = this.props;

    const redemptionsTip = RedemptionsTip(this.props);

    const redeemRewards = classNames({
      [css.redeemRewards]: true,
      [css.pending]: isRedeemPending,
      [css.disabled]: !redeemable && !executable
    });

    return (rewards.length > 0 || beneficiaryHasRewards || executable ?
      <Tooltip placement="left" trigger={["hover"]} overlay={redemptionsTip}>
        <button
          style={{ whiteSpace: "nowrap" }}
          disabled={false}
          className={redeemRewards}
          onClick={handleClickRedeem}
        >
          <img src="/assets/images/Icon/redeem.svg" />
          {
            isRedeemPending ?
              "Redeem in progress" :
              beneficiaryHasRewards && !accountHasRewards ?
                "Redeem for beneficiary" :
                rewards.length > 0 ?
                  "Redeem" :
                  "Execute"
          }
        </button>
      </Tooltip>
      : "");
  }
}

export default RedeemButton;
