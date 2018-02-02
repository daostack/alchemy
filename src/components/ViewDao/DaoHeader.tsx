import * as React from 'react';
import { Link } from 'react-router-dom'

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IDaoState } from 'reducers/arcReducer';

import EthBalance from 'components/EthBalance/EthBalance';

import * as css from './ViewDao.scss';

interface IStateProps {
  dao: IDaoState
}

interface IDispatchProps {
}

type IProps = IStateProps & IDispatchProps

export default class DaoHeader extends React.Component<IProps, null> {

  render() {
    const { dao } = this.props;

    return (
      <div className={css.header}>
        <h2>Viewing DAO: {dao.name}</h2>
        <div>Avatar address: {dao.avatarAddress}</div>
        <div>{dao.members.length} reputation holders with {dao.reputationCount} {dao.name} reputation</div>
        <div>Prediction Token: {dao.tokenName} ({dao.tokenSymbol})</div>
        <div>{dao.tokenCount} {dao.tokenSymbol} in circulation</div>
      </div>
    );
  }
}