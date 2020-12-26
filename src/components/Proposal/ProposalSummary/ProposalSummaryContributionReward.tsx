import { IDAOState, IProposalState } from "@daostack/arc.js";
import classNames from "classnames";
import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import * as React from "react";
import { IProfileState } from "@store/profiles/profilesReducer";
import RewardsString from "../RewardsString";

import * as css from "./ProposalSummary.scss";

interface IProps {
  beneficiaryProfile?: IProfileState;
  detailView?: boolean;
  dao: IDAOState;
  proposal: IProposalState;
  transactionModal?: boolean;
}

export default class ProposalSummaryContributionReward extends React.Component<IProps> {

  constructor(props: IProps) {
    super(props);
  }

  public render(): RenderOutput {

    const { beneficiaryProfile, proposal, dao, detailView, transactionModal } = this.props;

    const proposalSummaryClass = classNames({
      [css.detailView]: detailView,
      [css.transactionModal]: transactionModal,
      [css.proposalSummary]: true,
    });
    return (
      <div className={proposalSummaryClass}>
        <span className={css.transferType}><RewardsString proposal={proposal} dao={dao} /></span>
        <strong className={css.transferAmount}></strong>
        <img className={css.transferIcon} src="/assets/images/Icon/Transfer.svg" />
        <AccountPopup accountAddress={proposal.contributionReward.beneficiary} daoState={dao} width={12} />
        <strong>
          <AccountProfileName accountAddress={proposal.contributionReward.beneficiary} accountProfile={beneficiaryProfile} daoAvatarAddress={dao.address}/>
        </strong>
      </div>
    );

  }
}
