import * as React from "react";
import { Link } from "react-router-dom";

import { IProfileState } from "reducers/profilesReducer";

import * as classNames from "classnames";

import * as css from "./Account.scss";

interface IProps {
  accountAddress: string;
  accountProfile?: IProfileState;
  daoAvatarAddress?: string;
  detailView?: boolean;
  historyView?: boolean;
}

export default class AccountProfileName extends React.Component<IProps, null> {

  public render() {
    const { accountAddress, accountProfile, daoAvatarAddress, historyView, detailView } = this.props;

    const accountNameClass = classNames({
      [css.detailView]: this.props.detailView,
      [css.historyView]: this.props.historyView
    });

    return (
      <Link className={accountNameClass} to={"/profile/" + accountAddress + (daoAvatarAddress ? "?daoAvatarAddress=" + daoAvatarAddress : "")}>
        {accountProfile && accountProfile.name ? accountProfile.name : accountAddress.substr(0, 6) + "..."}
      </Link>
    );
  }
}
