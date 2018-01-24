import * as React from 'react';
import { Link } from 'react-router-dom'

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IDaoState } from 'reducers/arcReducer';

import EthBalance from 'components/EthBalance/EthBalance';

import * as css from './DaoList.scss';

interface IStateProps {
  daoList: { [key : string] : IDaoState }
}

interface IDispatchProps {
  getDAOList: typeof arcActions.getDAOList
}

type IProps = IStateProps & IDispatchProps

export default class DaoList extends React.Component<IProps, null> {

  componentDidMount() {
    this.props.getDAOList();
  }

  render() {
    const { daoList } = this.props;

    const daoNodes = Object.keys(daoList).map((key : string) => {
      const dao = daoList[key];
      return (
        <div key={"dao_" + dao.avatarAddress} className={css.dao}>
          <Link to={"/dao/" + dao.avatarAddress}><h3>{dao.name}</h3></Link>
          <div>Token: {dao.tokenName} ({dao.tokenSymbol})</div>
          <div>Num tokens: {dao.tokenCount}</div>
          <div>Reputation: {dao.reputationCount}</div>
        </div>
      );
    });

    return (
      <div className={css.wrapper}>
        <h2>Your DAOs</h2>
        {daoNodes ? daoNodes : "None"}
      </div>
    );
  }
}