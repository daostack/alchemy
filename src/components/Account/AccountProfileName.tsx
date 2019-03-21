import * as React from "react";
import { Link } from "react-router-dom";

import { IProfileState } from "reducers/profilesReducer";

import * as classNames from "classnames";

import * as css from "./Account.scss";

interface IProps {
  accountProfile?: IProfileState;
  daoAvatarAddress?: string;
  detailView?: boolean;
  historyView?: boolean;
}

export default class AccountProfileName extends React.Component<IProps, null> {

  public render() {
    const { accountProfile, daoAvatarAddress, historyView } = this.props;

    const accountNameClass = classNames({
      [css.historyView]: this.props.historyView
    });

    return (accountProfile && accountProfile.name ?
      <Link className={accountNameClass} to={"/profile/" + accountProfile.ethereumAccountAddress + (daoAvatarAddress ? "?daoAvatarAddress=" + daoAvatarAddress : "")}>{accountProfile.name}</Link>
      : " "
    );
  }
}
