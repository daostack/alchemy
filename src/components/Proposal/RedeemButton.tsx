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

    if (rewards.length > 0 || beneficiaryHasRewards || executable) {

      return <Tooltip placement="left" trigger={["hover"]} overlay={redemptionsTip}>
        <button
          style={{ whiteSpace: "nowrap" }}
          disabled={false}
          className={redeemRewards}
          onClick={handleClickRedeem}
        >
          {
            isRedeemPending ?
              "Redeem in progress" :
              beneficiaryHasRewards && !accountHasRewards ?
                "Redeem for beneficiary" :
                rewards.length > 0 ?
                  "Redeem" :
                  "Execute"
          }
          <img src="/assets/images/Icon/Loading-black.svg" />
        </button>;
      </Tooltip>;
    } else {
      return null;
    }
  }
}

export default RedeemButton;
