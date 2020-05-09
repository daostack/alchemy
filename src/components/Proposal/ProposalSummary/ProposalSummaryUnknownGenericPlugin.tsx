import { IGenericPluginProposalState } from "@daostack/arc.js";
import classNames from "classnames";
import { linkToEtherScan } from "lib/util";
import * as React from "react";
import { IProfileState } from "reducers/profilesReducer";
import * as css from "./ProposalSummary.scss";

interface IProps {
  beneficiaryProfile?: IProfileState;
  detailView?: boolean;
  proposalState: IGenericPluginProposalState;
  transactionModal?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IState {
}

export default class ProposalSummary extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
  }

  public render(): RenderOutput {
    const { proposalState, detailView, transactionModal } = this.props;
    const proposalSummaryClass = classNames({
      [css.detailView]: detailView,
      [css.transactionModal]: transactionModal,
      [css.proposalSummary]: true,
      [css.withDetails]: true,
    });
    return (
      <div className={proposalSummaryClass}>
        <span className={css.summaryTitle}>Unknown function call</span>
        {detailView ?
          <div className={css.summaryDetails}>
            to contract at <a href={linkToEtherScan(proposalState.contractToCall)}>{proposalState.contractToCall.substr(0, 8)}...</a>
          </div>
          : ""
        }
      </div>
    );
  }
}
