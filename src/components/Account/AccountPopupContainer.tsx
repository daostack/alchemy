import { denormalize } from "normalizr";
import Tooltip from "rc-tooltip";
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IAccountState, IProposalState, ProposalStates } from "reducers/arcReducer";
import { NotificationStatus, showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import * as schemas from "schemas";
import Util from "lib/util";

import AccountImage from "components/Account/AccountImage";
import AccountProfileName from "components/Account/AccountProfileName";
import OAuthLogin from "components/Account/OAuthLogin";
import ReputationView from "components/Account/ReputationView";

import * as css from "./Account.scss";
import { IDAOState, Address } from "@daostack/client"

interface IStateProps {
  accountAddress: string
  profile: IProfileState
  dao: IDAOState
  reputation: number
  tokens: number
}

interface IOwnProps {
  dao: IDAOState
  accountAddress: Address
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  const dao = ownProps.dao
  const account = state.arc.accounts[`${ownProps.accountAddress}-${ownProps.daoAvatarAddress}`] as IAccountState;

  return {
    accountAddress: ownProps.accountAddress,
    dao,
    profile: state.profiles[ownProps.accountAddress],
    reputation: account ? account.reputation : 0,
    tokens: account ? account.tokens : 0,
  };
};

interface IDispatchProps {
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  showNotification
};

type IProps = IStateProps & IDispatchProps;

class AccountPopupContainer extends React.Component<IProps, null> {

  public copyAddress = (e: any) => {
    const { showNotification, accountAddress } = this.props;
    Util.copyToClipboard(accountAddress);
    showNotification(NotificationStatus.Success, `Copied to clipboard!`);
    e.preventDefault();
  }

  public render() {
    const { accountAddress, dao, profile, reputation, tokens } = this.props;

    return (
      <div className={css.targetAccount}>
        <div className={css.avatar}>
          <AccountImage accountAddress={accountAddress} />
        </div>
        <div className={css.accountInfo}>
          <div className={css.name}><AccountProfileName accountProfile={profile} daoAvatarAddress={dao.address} /></div>
          {!profile || Object.keys(profile.socialURLs).length == 0 ? "No social profiles" :
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
            <div><ReputationView daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={reputation}/></div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountPopupContainer);
