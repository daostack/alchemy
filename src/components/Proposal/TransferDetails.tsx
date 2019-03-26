import * as React from "react";
import { IDAOState, IProposalState } from "@daostack/client";

import { IProfileState } from "reducers/profilesReducer";
import * as classNames from "classnames";
import RewardsString from "./RewardsString";
import AccountPopupContainer from "components/Account/AccountPopupContainer";
import AccountProfileName from "components/Account/AccountProfileName";

import * as css from "./TransferDetails.scss";

interface IProps {
  beneficiaryProfile?: IProfileState;
  detailView?: boolean;
  dao: IDAOState;
  proposal: IProposalState;
  transactionModal?: boolean;
}

export default class TransferDetails extends React.Component<IProps, null> {
  public render() {

    const { beneficiaryProfile, dao, proposal, detailView, transactionModal } = this.props;

    const transferDetailsClass = classNames({
      [css.detailView]: this.props.detailView,
      [css.transactionModal]: this.props.transactionModal,
      [css.transferDetails]: true,
    });

    return (
      <div className={transferDetailsClass}>
        <span className={css.transferType}><RewardsString proposal={proposal} dao={dao} /></span>
        <strong className={css.transferAmount}></strong>
        <img src="/assets/images/Icon/Transfer.svg" />
        <AccountPopupContainer accountAddress={proposal.beneficiary} dao={dao} />
        <AccountProfileName accountAddress={proposal.beneficiary} accountProfile={beneficiaryProfile} daoAvatarAddress={dao.address} />
      </div>
    );
  }
}
