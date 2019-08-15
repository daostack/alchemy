import { getArc } from "arc";

import BN = require("bn.js");
import * as classNames from "classnames";
import AccountImage from "components/Account/AccountImage";
import AccountProfileName from "components/Account/AccountProfileName";
import OAuthLogin from "components/Account/OAuthLogin";
import Reputation from "components/Account/Reputation";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { copyToClipboard  } from "lib/util";
import * as React from "react";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { NotificationStatus, showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import { combineLatest } from "rxjs";

import { Address, IDAOState, IMemberState } from "@daostack/client";
import * as css from "./Account.scss";


interface IExternalProps {
  accountAddress: Address;
  dao: IDAOState;
  detailView?: boolean;
  historyView?: boolean;
}

interface IStateProps {
  profile: IProfileState;
}

const mapStateToProps = (state: IRootState, ownProps: IExternalProps & ISubscriptionProps<[IDAOState, IMemberState]>): IExternalProps & IStateProps => {
  const account = (ownProps.data ? ownProps.data[1] : null);

  return {
    ...ownProps,
    profile: account ? state.profiles[account.address] : null
  };
};

interface IDispatchProps {
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  showNotification,
};

type IProps = IExternalProps & IStateProps & IDispatchProps & ISubscriptionProps<[IDAOState, IMemberState]>;

class AccountPopup extends React.Component<IProps, null> {

  public copyAddress = (e: any) => {
    const { showNotification, accountAddress } = this.props;
    copyToClipboard(accountAddress);
    showNotification(NotificationStatus.Success, "Copied to clipboard!");
    e.preventDefault();
  }

  public render() {
    const { data, error, isLoading } = this.props;

    if (isLoading) {
      return <div>Loading...</div>;
    }
    if (error) {
      return <div>{error.message}</div>;
    }

    const [dao, accountInfo] = data;
    const { accountAddress, profile } = this.props;
    const reputation = accountInfo ? accountInfo.reputation : new BN(0);

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

const SubscribedAccountPopup = withSubscription(
  ConnectedAccountPopup,

  // Update subscription?
  (oldProps, newProps) => { return oldProps.accountAddress !== newProps.accountAddress || oldProps.dao.address !== newProps.dao.address; },

  // Generate observables
  (props: IProps) => {
    const arc = getArc();
    return combineLatest(
      arc.dao(props.dao.address).state(),
      arc.dao(props.dao.address).member(props.accountAddress).state()
    );
  }
);

export default SubscribedAccountPopup;
