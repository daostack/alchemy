import Tooltip from "rc-tooltip";
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IDaoState, IProposalState, ProposalStates } from "reducers/arcReducer";
import { NotificationStatus, showNotification } from "reducers/operations";
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
  const dao = state.arc.daos[ownProps.daoAvatarAddress];
  const member = dao.members[ownProps.accountAddress];
  return {
    accountAddress: ownProps.accountAddress,
    dao,
    reputation: member ? member.reputation : 0,
    tokens: member ? member.tokens : 0,
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
            <div>{Math.round(tokens).toLocaleString()} <strong>{dao.tokenSymbol}</strong></div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountPopupContainer);
