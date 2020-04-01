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
                Executing this proposal will call the function
                <pre>{action.id}()</pre>
                with argument 'metadata':
                <pre>{decodedCallData.values[0]}</pre>
                at contract
                <pre><a href={linkToEtherScan(proposal.genericScheme.contractToCall)}>{proposal.genericScheme.contractToCall}</a></pre>
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
              <pre>{action.id}()</pre>
              with  argument 'addr':
              <pre>{decodedCallData.values[0]}</pre>
              at contract
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
              Executing this proposal will call the function
              <pre>{action.id}()</pre>
              with argument 'fee':
              <pre>{decodedCallData.values[0]}</pre>
              at contract
              <pre><a href={linkToEtherScan(proposal.genericScheme.contractToCall)}>{proposal.genericScheme.contractToCall}</a></pre>
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
                Executing this proposal will call the function
                <pre>{action.id}()</pre>
                with argument 'recipient':
                <pre>{decodedCallData.values[0]}</pre>
                at contract
                <pre><a href={linkToEtherScan(proposal.genericScheme.contractToCall)}>{proposal.genericScheme.contractToCall}</a></pre>
              </div>
                : ""
              }
            </div>
          );
      case "submitAnswerByArbitrator":
      default:
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg"/>&nbsp;
              {action.label}
            </span>
            { detailView ?
              <div className={css.summaryDetails}>
              Executing this proposal will call the function
              <pre>{action.id}()</pre>
              with argument 'QuestionId':
              <pre>{decodedCallData.values[0]}</pre>
              with argument 'Answer':
              <pre>{decodedCallData.values[1]}</pre>
              with argument 'Answerer':
              <pre>{decodedCallData.values[2]}</pre>
              at contract
              <pre><a href={linkToEtherScan(proposal.genericScheme.contractToCall)}>{proposal.genericScheme.contractToCall}</a></pre>
            </div>
              : ""
            }
          </div>
        );
    }
  }
}
