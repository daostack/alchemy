import * as React from "react";
import { Link } from "react-router-dom";

import { IProfileState } from "reducers/profilesReducer";

interface IProps {
  detailView?: boolean
  accountProfile?: IProfileState;
  daoAvatarAddress?: string;
}

export default class AccountProfileName extends React.Component<IProps, null> {

  public render() {
    const { accountProfile, daoAvatarAddress } = this.props;

    return (accountProfile && accountProfile.name ?
      <Link to={'/profile/' + accountProfile.ethereumAccountAddress + (daoAvatarAddress ? "?daoAvatarAddress=" + daoAvatarAddress : "")}>{accountProfile.name}</Link>
      : "");
  }
}
