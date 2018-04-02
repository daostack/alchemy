import Tooltip from 'rc-tooltip';
import * as React from "react";
import { NavLink } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IDaoState, IRedemptionState } from "reducers/arcReducer";

import * as css from "./ViewDao.scss";

interface IProps {
  currentAccountAddress: string;
  dao: IDaoState;
  redeemProposal: typeof arcActions.redeemProposal;
  redemptions: IRedemptionState[];
}

export default class DaoNav extends React.Component<IProps, null> {

  public handleClickRedeem(event: any) {
    const { dao, currentAccountAddress, redemptions, redeemProposal } = this.props;
    redemptions.forEach(async (redemption) => {
      await redeemProposal(dao.avatarAddress, redemption.proposal, currentAccountAddress);
    });
  }

  public render() {
    const { dao, redemptions } = this.props;

    let redeemAllTip : JSX.Element | string = "", ethReward = 0, nativeReward = 0, reputationReward = 0;
    if (redemptions.length > 0) {
      redemptions.forEach(async (redemption) => {
        ethReward += redemption.beneficiaryEth;
        nativeReward += redemption.voterTokens + redemption.stakerTokens + redemption.beneficiaryNativeToken;
        reputationReward += redemption.voterReputation + redemption.stakerReputation + redemption.beneficiaryReputation + redemption.proposerReputation;
      });

      redeemAllTip =
        <div>
          {redemptions.length} proposals with rewards waiting:
          <ul>
            {ethReward > 0 ? <li>ETH reward: {ethReward}</li> : ""}
            {nativeReward > 0 ? <li>{dao.tokenSymbol} token reward: {nativeReward}</li> : ""}
            {reputationReward > 0 ? <li>{dao.name} reputation reward: {reputationReward}</li> : ""}
          </ul>
        </div>;
    }

    return (
      <div className={css.nav}>
        <NavLink exact className={css.navItem} activeClassName={css.selected} to={"/dao/" + dao.avatarAddress}>Proposals</NavLink>
        <NavLink className={css.navItem} activeClassName={css.selected} to={"/dao/" + dao.avatarAddress + "/history/"}>History</NavLink>
        <NavLink className={css.navItem} activeClassName={css.selected} to={"/dao/" + dao.avatarAddress + "/recurring-transfers/"}>Recurring Transfers</NavLink>
        <NavLink className={css.navItem} activeClassName={css.selected} to={"/dao/" + dao.avatarAddress + "/members/"}>Members</NavLink>
        {redemptions.length > 0
          ? <NavLink className={css.navItem} activeClassName={css.selected} to={"/dao/" + dao.avatarAddress + "/redemptions/"}>Redemptions ({redemptions.length})</NavLink>
          : ""
        }
        {redemptions.length > 0
          ? <Tooltip placement="bottom" trigger={["hover"]} overlay={redeemAllTip}>
              <button
                className={css.redeemAllRewardsButton}
                onClick={this.handleClickRedeem.bind(this)}
              >
                Redeem All Rewards
              </button>
            </Tooltip>
          : ""
        }
        <NavLink className={css.createProposal} activeClassName={css.selected} to={"/proposal/create/" + dao.avatarAddress}>Create proposal</NavLink>
        <div className={css.borderBottom}></div>
      </div>
    );
  }
}
