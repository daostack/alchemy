import { IDAOState, IProposalState } from "@daostack/arc.js";
import classNames from "classnames";
import { GenericSchemeInfo } from "genericSchemeRegistry";
import { linkToEtherScan, formatTokens, truncateWithEllipses } from "lib/util";
import CopyToClipboard from "components/Shared/CopyToClipboard";
import * as React from "react";
import { IProfileState } from "reducers/profilesReducer";
import * as css from "./ProposalSummary.scss";
import ProposalSummaryDutchX from "./ProposalSummaryDutchX";
import ProposalSummaryStandardBounties from "./ProposalSummaryStandardBounties";
import ProposalSummaryCO2ken from "./ProposalSummaryCO2ken";

interface IExternalProps {
  beneficiaryProfile?: IProfileState;
  detailView?: boolean;
  dao: IDAOState;
  proposal: IProposalState;
  transactionModal?: boolean;
  genericSchemeInfo: GenericSchemeInfo;
}

type IProps = IExternalProps;

export default class ProposalSummary extends React.Component<IProps> {

  private inputHtml = (x: any) => <span key={x.name}>{x.name} {x.type}, </span>;
  private callDataHtml = (value: any, isArrayItem = false) => {
    if (value?.length > 66) {

      value = truncateWithEllipses(value, 66);

      return <div
        className={isArrayItem ? css.arrayItem : ""}
        key={value}
      >{value}<CopyToClipboard value={value}/>{isArrayItem ? "," : ""}
      </div>;

    } else {
      return <div className={isArrayItem ? css.arrayItem : ""} key={value}>{value}{isArrayItem ? "," : ""}</div>;
    }
  }

  public render(): RenderOutput {
    const { proposal, detailView, transactionModal, genericSchemeInfo } = this.props;
    if (genericSchemeInfo.specs.name === "DutchX") {
      return <ProposalSummaryDutchX {...this.props} />;
    } else if (genericSchemeInfo.specs.name === "Standard Bounties") {
      return <ProposalSummaryStandardBounties {...this.props} />;
    } else if (genericSchemeInfo.specs.name === "CO2ken") {
      return <ProposalSummaryCO2ken {...this.props} />;
    }
    const proposalSummaryClass = classNames({
      [css.detailView]: detailView,
      [css.transactionModal]: transactionModal,
      [css.proposalSummary]: true,
      [css.withDetails]: true,
    });
    let decodedCallData: any;
    const sendsETH = proposal.genericScheme.value.gtn(0);

    try {
      decodedCallData = genericSchemeInfo.decodeCallData(proposal.genericScheme.callData);
    } catch (err) {
      return (
        <div className={proposalSummaryClass}>
          <span className={css.summaryTitle}>Unknown function call
            {sendsETH ?
              <div className={css.warning}>&gt; Sending {formatTokens(proposal.genericScheme.value)} ETH &lt;</div>
              : ""
            }
          </span>
          {detailView ?
            <div className={css.summaryDetails}>
              To contract at: <pre><a href={linkToEtherScan(proposal.genericScheme.contractToCall)} target="_blank" rel="noopener noreferrer">{proposal.genericScheme.contractToCall}</a></pre>
              With callData: <pre>{truncateWithEllipses(proposal.genericScheme.callData, 42)}<CopyToClipboard value={proposal.genericScheme.callData} /></pre>
            </div>
            : ""
          }
        </div>
      );
    }

    return <div className={proposalSummaryClass}>
      <span className={css.summaryTitle}>
        <img src="/assets/images/Icon/edit-sm.svg" />&nbsp;
        {decodedCallData.action.label}

        {sendsETH ?
          <div className={css.warning}>&gt; Sending {formatTokens(proposal.genericScheme.value)} ETH &lt;</div>
          : ""
        }
      </span>

      {detailView ?
        <div className={css.summaryDetails}>
          Executing this proposal will call the function:
          <pre>{decodedCallData.action.abi.name}
        ({decodedCallData.action.abi.inputs.map(this.inputHtml)})
          </pre>
          with values: <pre>{
            decodedCallData.values.map((value: string | Array<string>) => {
              if (value instanceof Array) {
                return <>
                  <span>[</span>
                  {value.map((value: string) => this.callDataHtml(value, true))}
                  <span>]</span>
                </>;
              } else {
                return this.callDataHtml(value);
              }
            })}
          </pre>
          on contract at:
          <pre><a href={linkToEtherScan(proposal.genericScheme.contractToCall)}>{proposal.genericScheme.contractToCall}</a></pre>
          sending to contract:
          <pre className={sendsETH ? css.warning : ""}>{formatTokens(proposal.genericScheme.value)} ETH</pre>
        </div>
        : ""
      }
    </div>;
  }
}
