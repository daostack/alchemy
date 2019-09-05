import { IProposalState } from "@daostack/client";

import BN = require("bn.js");
import * as classNames from "classnames";
import { GenericSchemeInfo } from "genericSchemeRegistry";
import { formatTokens, linkToEtherScan } from "lib/util";
import * as React from "react";
import * as css from "./ProposalSummary.scss";

interface IProps {
  genericSchemeInfo: GenericSchemeInfo;
  detailView?: boolean;
  proposal: IProposalState;
  transactionModal?: boolean;
}

export default class ProposalSummaryDutchX extends React.Component<IProps, null> {

  public render() {
    const { proposal, detailView, genericSchemeInfo, transactionModal } = this.props;
    const decodedCallData = genericSchemeInfo.decodeCallData(proposal.genericScheme.callData);
    const action = decodedCallData.action;

    const proposalSummaryClass = classNames({
      [css.detailView]: detailView,
      [css.transactionModal]: transactionModal,
      [css.proposalSummary]: true,
      [css.withDetails]: true,
    });

    switch (action.id) {
      case "issueAndContribute":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              New Bounty Created
            </span>
            { detailView ?
              <div className={css.summaryDetails}>
                Bounty Details: <a href={`https://ipfs.io/ipfs/${decodedCallData.values[3]}`} target="_blank" rel="noopener noreferrer">{decodedCallData.values[3]}</a>. <br/>
                Deadline set at {new Date(decodedCallData.values[4])}. <br />
                Amount funded at {decodedCallData.values[7]} {decodedCallData.values[6].toString() === '0' ?  'ETH'  : 'tokens'}.
              </div>
              : ""
            }
          </div>
        );
      case "contribute":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              Adding Contribution to a Bounty
            </span>
            {detailView ?
              <div className={css.summaryDetails}>
                Contribution of amount {decodedCallData.values[2]}
              </div>
              : ""
            }
          </div>
        );
      case "refundContributions":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg" />&nbsp;
              {action.label}
            </span>
            {detailView ?
              <div className={css.summaryDetails}>
                Refund for contribution IDs {decodedCallData.values[3]}
              </div>
              : ""
            }
          </div>
        );
      case "drainBounty":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              {action.label}
            </span>
            {detailView ?
              <div className={css.summaryDetails}>
                Draining {decodedCallData.values[3]} amount of tokens.
              </div>
              : ""
            }
          </div>
        );
      case "acceptFulfillment":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              Accept Submission
            </span>
            {detailView ?
              <div className={css.summaryDetails}>
                Accepting submission ID {decodedCallData.values[2]} for {decodedCallData.values[4]} tokens. 
              </div>
              : ""
            }
          </div>
        );
      case "changeBounty":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              {action.label}
            </span>
            {detailView ?
              <div className={css.summaryDetails}>
                For Bounty ID {decodedCallData.values[1]}, <br/>
                Change issuers to: {decodedCallData.values[3].forEach((addr: string) => {
                  <br />
                  { '\u2B24' } <a href={linkToEtherScan(addr)} target="_blank" rel="noopener noreferrer">{addr}</a>
                })}<br />
                Change approvers to: {decodedCallData.values[4].forEach((addr: string) => {
                  <br />
                  { '\u2B24' } <a href={linkToEtherScan(addr)} target="_blank" rel="noopener noreferrer">{addr}</a>
                })}<br />
                Change bounty details to <a href={`https://ipfs.io/ipfs/${decodedCallData.values[5]}`} target="_blank" rel="noopener noreferrer">{decodedCallData.values[5]}</a><br/>
                Change bounty deadline to {new Date(decodedCallData.values[6])}
              </div>
              : ""
            }
          </div>
        );
      case "changeData":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              {action.label}
            </span>
            {detailView ?
              <div className={css.summaryDetails}>
                Change details of bounty ID  {decodedCallData.values[1]} to <a href={`https://ipfs.io/ipfs/${decodedCallData.values[3]}`} target="_blank" rel="noopener noreferrer">{decodedCallData.values[3]}</a>
              </div>
              : ""
            }
          </div>
        );
      case "changeDeadline":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              Change Bounty Deadline
            </span>
            {detailView ?
              <div className={css.summaryDetails}>
                Change bounty deadline to {new Date(decodedCallData.values[3])}
              </div>
              : ""
            }
          </div>
        );
      case "fulfillAndAccept":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              Fulfill and Accept Bounty
            </span>
            {detailView ?
              <ul className={css.summaryDetails}>
                Accept submission of and send {decodedCallData.values[5]} tokens to <a href={linkToEtherScan(decodedCallData.values[2])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[2]}</a>
              </ul>
              : ""
            }
          </div>
        );
      case "replaceApprovers":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              {action.label}
            </span>
            {detailView ?
              <div className={css.summaryDetails}>
                Change approvers to: {decodedCallData.values[3].forEach((addr: string) => {
                  <br />
                  { '\u2B24' } <a href={linkToEtherScan(addr)} target="_blank" rel="noopener noreferrer">{addr}</a>
                })}
              </div>
              : ""
            }
          </div>
        );
      case "replaceIssuers":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              {action.label}
            </span>
            {detailView ?
              <div className={css.summaryDetails}>
                Change issuers to: {decodedCallData.values[3].forEach((addr: string) => {
                  <br />
                  { '\u2B24' } <a href={linkToEtherScan(addr)} target="_blank" rel="noopener noreferrer">{addr}</a>
                })}<br />
              </div>
              : ""
            }
          </div>
        );
      default:
        return "";
    }
  }
}
