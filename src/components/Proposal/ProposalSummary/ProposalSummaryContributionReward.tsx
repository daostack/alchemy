import { IDAOState, IContributionRewardProposalState } from "@daostack/arc.js";
import classNames from "classnames";
import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import * as React from "react";
import { IProfileState } from "reducers/profilesReducer";
import RewardsString from "../RewardsString";

import * as css from "./ProposalSummary.scss";

interface IProps {
  beneficiaryProfile?: IProfileState;
  detailView?: boolean;
  daoState: IDAOState;
  proposalState: IContributionRewardProposalState;
  transactionModal?: boolean;
}

export default class ProposalSummaryContributionReward extends React.Component<IProps> {

  constructor(props: IProps) {
    super(props);
  }

  public render(): RenderOutput {

    const { beneficiaryProfile, proposalState, daoState, detailView, transactionModal } = this.props;

    const proposalSummaryClass = classNames({
      [css.detailView]: detailView,
      [css.transactionModal]: transactionModal,
      [css.proposalSummary]: true,
    });
    return (
      <div className={proposalSummaryClass}>
        <span className={css.transferType}><RewardsString proposalState={proposalState} daoState={daoState} /></span>
        <strong className={css.transferAmount}></strong>
        <img className={css.transferIcon} src="/assets/images/Icon/Transfer.svg" />
        <AccountPopup accountAddress={proposalState.beneficiary} daoState={daoState} width={12} />
        <strong>
          <AccountProfileName accountAddress={proposalState.beneficiary} accountProfile={beneficiaryProfile} daoAvatarAddress={daoState.address}/>
        </strong>
      </div>
    );

  }
}
