import * as React from "react";
import { NavLink } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IDaoState, IRedemptionState } from "reducers/arcReducer";

import * as css from "./ViewDao.scss";

interface IProps {
  currentAccountAddress: string;
  dao: IDaoState;
  numRedemptions: number;
}

export default class DaoNav extends React.Component<IProps, null> {

  public render() {
    const { dao, numRedemptions } = this.props;

    return (
      <div className={css.nav}>
        <NavLink exact className={css.navItem} activeClassName={css.selected} to={"/dao/" + dao.avatarAddress}>Proposals</NavLink>
        <NavLink className={css.navItem} activeClassName={css.selected} to={"/dao/" + dao.avatarAddress + "/history/"}>History</NavLink>
        {numRedemptions > 0
          ? <NavLink className={css.navRedemption} activeClassName={css.selected} to={"/dao/" + dao.avatarAddress + "/redemptions/"}>
              Redemptions <span className={css.redemptionNotification}>{numRedemptions}</span>
            </NavLink>
          : ""
        }
        <NavLink className={css.createProposal} activeClassName={css.selected} to={`/dao/${dao.avatarAddress}/proposals/create`}>
          <img src="/assets/images/Icon/Draft-white.svg"/>
        </NavLink>
        <div className={css.borderBottom}></div>
      </div>
    );
  }
}
