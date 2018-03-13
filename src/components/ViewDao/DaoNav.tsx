import * as React from "react";
import { NavLink } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IDaoState } from "reducers/arcReducer";

import * as css from "./ViewDao.scss";

interface IProps {
  dao: IDaoState;
}

export default class DaoNav extends React.Component<IProps, null> {

  public render() {
    const { dao } = this.props;

    return (
      <div className={css.nav}>
        <NavLink exact className={css.navItem} activeClassName={css.selected} to={"/dao/" + dao.avatarAddress}>Proposals</NavLink>
        <NavLink className={css.navItem} activeClassName={css.selected} to={"/dao/" + dao.avatarAddress + "/history/"}>History</NavLink>
        <NavLink className={css.navItem} activeClassName={css.selected} to={"/dao/" + dao.avatarAddress + "/recurring-transfers/"}>Recurring Transfers</NavLink>
        <NavLink className={css.navItem} activeClassName={css.selected} to={"/dao/" + dao.avatarAddress + "/members/"}>Members</NavLink>
        <NavLink className={css.createProposal} activeClassName={css.selected} to={"/proposal/create/" + dao.avatarAddress}>Create proposal</NavLink>
        <div className={css.borderBottom}></div>
      </div>
    );
  }
}
