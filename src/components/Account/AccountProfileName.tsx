import * as React from "react";
import { Link } from "react-router-dom";

import { IProfileState } from "reducers/profilesReducer";

import * as css from "./Account.scss";

interface IProps {
  accountProfile?: IProfileState;
  daoAvatarAddress?: string;
}

export default class AccountProfileName extends React.Component<IProps, null> {

  public render() {
    const { accountProfile, daoAvatarAddress } = this.props;
    console.log("name = ", accountProfile, accountProfile.name);

    return (accountProfile && accountProfile.name ?
      <Link to={'/profile/' + accountProfile.ethereumAccountAddress + (daoAvatarAddress ? "?daoAvatarAddress=" + daoAvatarAddress : "")}>{accountProfile.name}</Link>
      : "");
  }
}
