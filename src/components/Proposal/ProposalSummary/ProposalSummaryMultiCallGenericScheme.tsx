import { IDAOState, IProposalState } from "@daostack/arc.js";
import classNames from "classnames";
import { linkToEtherScan, formatTokens, baseTokenName, truncateWithEllipses } from "lib/util";
import * as React from "react";
import { IProfileState } from "reducers/profilesReducer";
import * as css from "./ProposalSummary.scss";
import BN = require("bn.js");
import CopyToClipboard from "components/Shared/CopyToClipboard";

interface IProps {
  beneficiaryProfile?: IProfileState;
  detailView?: boolean;
  dao: IDAOState;
  proposal: IProposalState;
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
    const { proposal, detailView, transactionModal } = this.props;
    const tokenAmountToSend = new BN(proposal.genericSchemeMultiCall.values.reduce((a: BN, b: BN) => new BN(a).add(new BN(b))));
    const proposalSummaryClass = classNames({
      [css.detailView]: detailView,
      [css.transactionModal]: transactionModal,
      [css.proposalSummary]: true,
      [css.withDetails]: true,
    });
    return (
      <div className={proposalSummaryClass}>
        <span className={css.summaryTitle}>
          Generic multicall
          {tokenAmountToSend.gtn(0) && <div className={css.warning}>&gt; Sending {formatTokens(tokenAmountToSend)} {baseTokenName()} &lt;</div>}
        </span>
        {detailView &&
          <div className={css.summaryDetails}>
            {
              proposal.genericSchemeMultiCall.contractsToCall.map((contract, index) => (
                <div key={index} className={css.multiCallContractDetails}>
                  <p>Contract:</p>
                  {<pre><a href={linkToEtherScan(contract)} target="_blank" rel="noopener noreferrer">{contract}</a></pre>}
                  <p>Sending to contract:</p>
                  <pre>{formatTokens(new BN(proposal.genericSchemeMultiCall.values[index]))} {baseTokenName()}</pre>
                  <p>Raw call data:</p>
                  <pre>{truncateWithEllipses(proposal.genericSchemeMultiCall.callsData[index], 66)}<CopyToClipboard value={proposal.genericSchemeMultiCall.callsData[index]} /></pre>
                </div>
              ))
            }
          </div>
        }
      </div>
    );
  }
}
