import { denormalize } from "normalizr";
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IDaoState } from "reducers/arcReducer";

import * as schemas from "schemas";

import * as css from "./DaoList.scss";

interface IStateProps {
  dao: IDaoState,
  daoAddress: string
}

const mapStateToProps = (state: IRootState, ownProps: any) => ({
  dao: state.arc.daos[ownProps.daoAddress]
});

interface IDispatchProps {
  getDAO: typeof arcActions.getDAO
}

const mapDispatchToProps = {
  getDAO: arcActions.getDAO
};

type IProps = IStateProps & IDispatchProps;

class DaoContainer extends React.Component<IProps, null> {

  public daoSubscription: any;

  public async componentWillMount() {
    this.daoSubscription = this.props.getDAO(this.props.daoAddress);
  }

  public componentWillUnmount() {
    this.daoSubscription.unsubscribe();
  }

  public render() {
    const { daoAddress, dao } = this.props

    return  (
      <Link
        className={css.daoLink}
        to={"/dao/" + dao.avatarAddress}
        key={"dao_" + dao.avatarAddress}
        data-test-id="dao-link"
      >
        <div className={css.dao}>
          <div className={css.daoAvatar}>
            <img src="/assets/images/daostack-logo.png"/>
          </div>
          <h3 className={css.daoName}>{dao.name}</h3>
          <div className={css.daoInfo}>Token: {dao.tokenName} ({dao.tokenSymbol})</div>
          <div className={css.daoInfo}>Num tokens: { dao.token  && dao.token.address }{Math.round(dao.tokenCount).toLocaleString()}</div>
          <div className={css.daoInfo}>Reputation: {Math.round(dao.reputationCount).toLocaleString()}</div>
        </div>
      </Link>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DaoContainer);
