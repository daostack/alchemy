import * as React from 'react';
import { connect, Dispatch } from 'react-redux';

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IDaoState } from 'reducers/arcReducer';

import * as css from './ViewDao.scss';

interface IStateProps {
  dao: any,
  daoAddress : string
}

const mapStateToProps = (state : IRootState, ownProps: any) => {
  return {
    dao: state.arc.daoList[ownProps.match.params.daoAddress],
    daoAddress : ownProps.match.params.daoAddress
  };
};

interface IDispatchProps {
  getDAO: typeof arcActions.getDAO
}

const mapDispatchToProps = {
  getDAO: arcActions.getDAO
};

type IProps = IStateProps & IDispatchProps

class ViewDaoContainer extends React.Component<IProps, null> {

  componentDidMount() {
    this.props.getDAO(this.props.daoAddress);
  }

  render() {
    const { dao } = this.props;

    return(
      dao ?
        <div className={css.wrapper}>
          <h2>Viewing Dao: {dao.name}</h2>
          <div>Token: {dao.tokenName} ({dao.tokenSymbol})</div>
          <div>Num members: {dao.members.length}</div>
          <div>Num tokens: {dao.tokenCount}</div>
          <div>Omega: {dao.reputationCount}</div>
        </div>
       : <div>Loading... </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewDaoContainer);