import * as React from 'react';
import { Link } from 'react-router-dom'

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IDaoState } from 'reducers/arcReducer';

import EthBalance from 'components/EthBalance/EthBalance';

import * as css from './ViewDao.scss';

interface IProps {
  dao: IDaoState
}

export default class DaoNav extends React.Component<IProps, null> {

  render() {
    const { dao } = this.props;

    return (
      <div className={css.nav}>
        <span><Link to={'/dao/'+dao.avatarAddress}>Proposals</Link></span>
        <span>Decisions</span> |
        <span>DAOs</span> |
        <span>Budgets</span> |
        <span>Recurring Transfers</span>
        <span><Link to={'/proposal/create/'+dao.avatarAddress}>Create Proposal</Link></span>
      </div>
    );
  }
}