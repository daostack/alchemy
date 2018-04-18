import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IDaoState, IProposalState, ProposalStates } from "reducers/arcReducer";

import AccountImage from "components/Account/AccountImage";

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

interface IDispatchProps {}

const mapDispatchToProps = {};

type IProps = IStateProps & IDispatchProps;

class AccountPopupContainer extends React.Component<IProps, null> {

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
            <button><img src="/assets/images/Icon/Copy-white.svg"/></button>
          </div>
          <div className={css.holdings}>
            <span>HOLDINGS</span>
            <div>{Math.round(reputation).toLocaleString()} <strong>{dao.name} Reputation</strong></div>
            <div>{Math.round(tokens).toLocaleString()} <strong>{dao.tokenSymbol}</strong></div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AccountPopupContainer);
