import { IGenericPluginProposalState } from "@daostack/arc.js";
import classNames from "classnames";
import { linkToEtherScan, formatTokens } from "lib/util";
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
    const sendsETH = proposalState.value.gtn(0);
    const proposalSummaryClass = classNames({
      [css.detailView]: detailView,
      [css.transactionModal]: transactionModal,
      [css.proposalSummary]: true,
      [css.withDetails]: true,
    });
    return (
      <div className={proposalSummaryClass}>
        <span className={css.summaryTitle}>
        Unknown function call
          {sendsETH ?
            <div className={css.warning}>&gt; Sending {formatTokens(proposalState.value)} ETH &lt;</div>
            : ""
          }
        </span>
        {detailView ?
          <div className={css.summaryDetails}>
            To contract at:
            <pre><a href={linkToEtherScan(proposalState.contractToCall)} target="_blank" rel="noopener noreferrer">{proposalState.contractToCall}</a></pre>
            sending to contract:
            <pre className={sendsETH ? css.warning : ""}>{formatTokens(proposalState.value)} ETH</pre>
          </div>
          : ""
        }
      </div>
    );
  }
}
