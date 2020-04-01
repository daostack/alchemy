import { IProposalState } from "@daostack/client";
import classNames from "classnames";
import { GenericSchemeInfo } from "genericSchemeRegistry";
import { linkToEtherScan } from "lib/util";
import * as React from "react";
import * as css from "./ProposalSummary.scss";

interface IProps {
  genericSchemeInfo: GenericSchemeInfo;
  detailView?: boolean;
  proposal: IProposalState;
  transactionModal?: boolean;
}

export default class ProposalSummaryOmenDisputeResolution extends React.Component<IProps, null> {

  private inputHtml = (x: any) => <span key={x.name}>{x.name} {x.type}</span>;
  private callDataHtml = (value: any) => <div key={value}>{value}</div>;

  public render(): RenderOutput {
    const { proposal, detailView, genericSchemeInfo, transactionModal } = this.props;
    let decodedCallData: any;
    try {
      decodedCallData = genericSchemeInfo.decodeCallData(proposal.genericScheme.callData);
    } catch(err) {
      if (err.message.match(/no action matching/gi)) {
        return <div>Error: {err.message} </div>;
      } else {
        throw err;
      }
    }
    const action = decodedCallData.action;

    const proposalSummaryClass = classNames({
      [css.detailView]: detailView,
      [css.transactionModal]: transactionModal,
      [css.proposalSummary]: true,
      [css.withDetails]: true,
    });

    switch (action.id) {
      case "setMetaData":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg"/>&nbsp;
              {action.label}
            </span>
            { detailView ?
              <div className={css.summaryDetails}>
                New oracle address: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a>
              </div>
              : ""
            }
          </div>
        );
      case "setRealitio":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg"/>&nbsp;
              {action.label}
            </span>
            { detailView ?
              <div className={css.summaryDetails}>
              Executing this proposal will call the function
              <pre>{ decodedCallData.action.abi.name}
            ({ decodedCallData.action.abi.inputs.map(this.inputHtml) })
              </pre>
              with values <pre>{ decodedCallData.values.map(this.callDataHtml)}</pre>
              on contract at
              <pre><a href={linkToEtherScan(proposal.genericScheme.contractToCall)}>{proposal.genericScheme.contractToCall}</a></pre>
            </div>
              : ""
            }
          </div>
        );
      
      case "setDisputeFee":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg"/>&nbsp;
              {action.label}
            </span>
            { detailView ?
              <div className={css.summaryDetails}>
                New owner address: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a>
              </div>
              : ""
            }
          </div>
        );
        case "setFeeRecipient":
          return (
            <div className={proposalSummaryClass}>
              <span className={css.summaryTitle}>
                <img src="/assets/images/Icon/edit-sm.svg"/>&nbsp;
                {action.label}
              </span>
              { detailView ?
                <div className={css.summaryDetails}>
                  New owner address: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a>
                </div>
                : ""
              }
            </div>
          );
      case "submitAnswerByArbitrator":
      default:
        return "";
    }
  }
}
