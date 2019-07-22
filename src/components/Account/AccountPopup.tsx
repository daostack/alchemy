import { getArc } from "arc";

import BN = require("bn.js");
import * as classNames from "classnames";
import AccountImage from "components/Account/AccountImage";
import AccountProfileName from "components/Account/AccountProfileName";
import OAuthLogin from "components/Account/OAuthLogin";
import Reputation from "components/Account/Reputation";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import { copyToClipboard  } from "lib/util";
import * as React from "react";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { NotificationStatus, showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import { combineLatest } from "rxjs";

import { Address, IDAOState, IMemberState } from "@daostack/client";
import * as css from "./Account.scss";


interface IStateProps {
  accountAddress: string;
  dao: IDAOState;
  detailView?: boolean;
  historyView?: boolean;
  profile: IProfileState;
  reputation: BN;
}

interface IOwnProps {
  accountAddress: Address;
  dao: IDAOState;
  detailView?: boolean;
  historyView?: boolean;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  const dao = ownProps.dao;
  const account = ownProps.accountInfo as IMemberState;

  return {
    accountAddress: ownProps.accountAddress,
    dao,
    profile: state.profiles[account.address],
    reputation: account ? account.reputation : new BN(0),
  };
};

interface IDispatchProps {
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  showNotification,
};

type IProps = IStateProps & IDispatchProps;

class AccountPopup extends React.Component<IProps, null> {

  public copyAddress = (e: any) => {
    const { showNotification, accountAddress } = this.props;
    copyToClipboard(accountAddress);
    showNotification(NotificationStatus.Success, "Copied to clipboard!");
    e.preventDefault();
  }

  public render() {
    const { accountAddress, dao, profile, reputation } = this.props;

    const targetAccountClass = classNames({
      [css.detailView]: this.props.detailView,
      [css.historyView]: this.props.historyView,
      [css.targetAccount]: true,
    });

    return (
      <div className={targetAccountClass}>
        <div className={css.avatar}>
          <AccountImage accountAddress={accountAddress} />
        </div>
        <div className={css.accountInfo}>
          <div className={css.name}><AccountProfileName accountAddress={accountAddress} accountProfile={profile} daoAvatarAddress={dao.address} /></div>
          {!profile || Object.keys(profile.socialURLs).length === 0 ? "No social profiles" :
            <div>
              <OAuthLogin editing={false} provider="facebook" accountAddress={accountAddress} profile={profile} />
              <OAuthLogin editing={false} provider="twitter" accountAddress={accountAddress} profile={profile} />
              <OAuthLogin editing={false} provider="github" accountAddress={accountAddress} profile={profile} />
            </div>
          }
          <div className={css.beneficiaryAddress}>
            <span>{accountAddress}</span>
            <button onClick={this.copyAddress}><img src="/assets/images/Icon/Copy-black.svg"/></button>
          </div>
          <div className={css.holdings}>
            <span>HOLDINGS</span>
            <div><Reputation daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={reputation}/></div>
          </div>
        </div>
      </div>
    );
  }
}

const ConnectedAccountPopup = connect(mapStateToProps, mapDispatchToProps)(AccountPopup);

export default (props: IOwnProps) => {
  const arc = getArc();

  const observable = combineLatest(
    arc.dao(props.dao.address).state(),
    arc.dao(props.dao.address).member(props.accountAddress).state()
  );
  return <Subscribe observable={observable}>{
    (state: IObservableState<[IDAOState, IMemberState]>) => {
      if (state.error) {
        return <div>{state.error.message}</div>;
      } else if (state.data) {
        const dao = state.data[0];
        return <ConnectedAccountPopup dao={dao} accountAddress={props.accountAddress} accountInfo={state.data[1]} {...props} />;
      } else {
        return <div>Loading...</div>;
      }
    }
  }</Subscribe>;
};
