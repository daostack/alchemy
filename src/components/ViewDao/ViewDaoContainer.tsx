import * as React from 'react';
import { connect, Dispatch } from 'react-redux';

import { IStateShape } from 'reducers';

import * as css from './ViewDao.scss';

interface IStateProps {
  dao: any
}

const mapStateToProps = (state : IStateShape, ownProps: any) => {
  return {
    dao: state.arc.daoList.find((dao : any) => (dao.avatarAddress == ownProps.match.params.dao_address))
  };
};

type IProps = IStateProps

class ViewDaoContainer extends React.Component<IProps, null> {

  render() {
    const { dao } = this.props;

    return(
      <div className={css.wrapper}>
        <h2>Viewing Dao: {dao.name}</h2>
        <div>Token: {dao.tokenName} ({dao.tokenSymbol})</div>
        <div>Num members: {dao.members}</div>
        <div>Num tokens: {dao.tokenCount}</div>
        <div>Omega: {dao.reputationCount}</div>
      </div>
    );
  }
}

export default connect(mapStateToProps)(ViewDaoContainer);