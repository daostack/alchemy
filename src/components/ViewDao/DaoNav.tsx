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
        <Link className={css.navItem + " " + css.selected} to={'/dao/'+dao.avatarAddress}>Proposals</Link>
        <Link className={css.navItem} to={'/dao/'+dao.avatarAddress+'/history/'}>History</Link>
        <Link className={css.navItem} to={'/dao/'+dao.avatarAddress+'/recurring-transfers/'}>Recurring Transfers</Link>
        <Link className={css.createProposal} to={'/proposal/create/'+dao.avatarAddress}>Create proposal</Link>
      </div>
    );
  }
}