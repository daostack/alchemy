import * as React from "react";

import { IDAOState, IProposalState } from '@daostack/client'

import { IProfileState } from "reducers/profilesReducer";

import RewardsString from "./RewardsString";
import AccountPopupContainer from "components/Account/AccountPopupContainer";
import AccountProfileName from "components/Account/AccountProfileName";

import * as css from './TransferDetails.scss';

interface IProps {
  beneficiaryProfile?: IProfileState;
  dao: IDAOState;
  proposal: IProposalState;
}

export default class TransferDetails extends React.Component<IProps, null> {
  public render() {
    const { beneficiaryProfile, dao, proposal } = this.props;

    return (
      <div className={css.transferDetails}>
        <span className={css.transferType}><RewardsString proposal={proposal} dao={dao} /></span>
        <strong className={css.transferAmount}></strong>
        <img src="/assets/images/Icon/Transfer.svg" />

        <AccountPopupContainer accountAddress={proposal.beneficiary} dao={dao} />
        <AccountProfileName accountProfile={beneficiaryProfile} daoAvatarAddress={dao.address} />
      </div>
    );
  }
}
