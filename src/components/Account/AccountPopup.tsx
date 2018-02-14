import * as React from 'react';
import { Link } from 'react-router-dom'

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IProposalState, ProposalStates } from 'reducers/arcReducer';

import AccountImage from 'components/Account/AccountImage';

import * as css from './Account.scss';

interface IProps {
  accountAddress: string
  daoAvatarAddress: string
}

export default class AccountPopup extends React.Component<IProps, null> {

  render() {
    const { accountAddress, daoAvatarAddress } = this.props;

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
            <div>15,2333 <strong>Genesis Reputation</strong></div>
            <div>15,2333 <strong>GEN</strong></div>
            <div>15,2333 <strong>ETH</strong></div>
          </div>
          <button className={css.viewProfile}>View Profile</button>
        </div>
      </div>
    );
  }
}