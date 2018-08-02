import { denormalize } from "normalizr";
import Tooltip from "rc-tooltip";
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IAccountState, IDaoState, IProposalState, ProposalStates } from "reducers/arcReducer";
import { NotificationStatus, showNotification } from "reducers/notifications";
import * as schemas from "schemas";
import Util from "lib/util";

import AccountImage from "components/Account/AccountImage";
import ReputationView from "components/Account/ReputationView";

import * as css from "./Account.scss";

interface IStateProps {
  accountAddress: string;
  dao: IDaoState;
  reputation: number;
  tokens: number;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  const dao = denormalize(state.arc.daos[ownProps.daoAvatarAddress], schemas.daoSchema, state.arc);
  const account = state.arc.accounts[`${ownProps.accountAddress}-${ownProps.daoAvatarAddress}`] as IAccountState;

  return {
    accountAddress: ownProps.accountAddress,
    dao,
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

  public copyAddress = () => {
    const { showNotification, accountAddress } = this.props;
    Util.copyToClipboard(accountAddress);
    showNotification(NotificationStatus.Success, `Copied to clipboard!`);
  }

  public render() {
    const { accountAddress, dao, reputation, tokens } = this.props;

    return (
      <div className={css.targetAccount}>
        <div className={css.avatar}>
          <AccountImage accountAddress={accountAddress} />
        </div>
        <div className={css.accountInfo}>
          <div className={css.beneficiaryAddress}>
            <span>{accountAddress}</span>
            <button onClick={this.copyAddress}><img src="/assets/images/Icon/Copy-black.svg"/></button>
          </div>
          <div className={css.holdings}>
            <span>HOLDINGS</span>
            <div><ReputationView daoName={dao.name} totalReputation={dao.reputationCount} reputation={reputation}/></div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountPopupContainer);
