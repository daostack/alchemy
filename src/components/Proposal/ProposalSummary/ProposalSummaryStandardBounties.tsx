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
              New Bounty Created {decodedCallData.values[7].toString() === '0' && `funded at ${decodedCallData.values[7]} ETH}`}
            </span>
            { detailView ?
              <div className={css.summaryDetails}>
                Deadline set at { new Date(decodedCallData.values[4]) }
              </div>
              : ""
            }
          </div>
        );
      case "contribute":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg" />&nbsp;
              {action.label}
            </span>
            {detailView ?
              <div className={css.summaryDetails}>
                New oracle address: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a>
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
                New owner address: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a>
              </div>
              : ""
            }
          </div>
        );
      case "drainBounty":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              {decodedCallData.values[1] ? "+" : "-"}&nbsp;
              {decodedCallData.values[1] ? "Whitelist" : "Delist"} {decodedCallData.values[0].length} token{decodedCallData.values[0].length !== 1 ? "s" : ""}
            </span>
            {detailView ?
              <ul className={css.summaryDetails}>
                {decodedCallData.values[0].map((token: string) => <li key={token}><a href={linkToEtherScan(token)} target="_blank" rel="noopener noreferrer">{token}</a></li>)}
              </ul>
              : ""
            }
          </div>
        );
      case "acceptFulfillment":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              {decodedCallData.values[1] ? "+" : "-"}&nbsp;
              {decodedCallData.values[1] ? "Whitelist" : "Delist"} {decodedCallData.values[0].length} token{decodedCallData.values[0].length !== 1 ? "s" : ""}
            </span>
            {detailView ?
              <ul className={css.summaryDetails}>
                {decodedCallData.values[0].map((token: string) => <li key={token}><a href={linkToEtherScan(token)} target="_blank" rel="noopener noreferrer">{token}</a></li>)}
              </ul>
              : ""
            }
          </div>
        );
      case "changeBounty":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              {decodedCallData.values[1] ? "+" : "-"}&nbsp;
              {decodedCallData.values[1] ? "Whitelist" : "Delist"} {decodedCallData.values[0].length} token{decodedCallData.values[0].length !== 1 ? "s" : ""}
            </span>
            {detailView ?
              <ul className={css.summaryDetails}>
                {decodedCallData.values[0].map((token: string) => <li key={token}><a href={linkToEtherScan(token)} target="_blank" rel="noopener noreferrer">{token}</a></li>)}
              </ul>
              : ""
            }
          </div>
        );
      case "changeData":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              {decodedCallData.values[1] ? "+" : "-"}&nbsp;
              {decodedCallData.values[1] ? "Whitelist" : "Delist"} {decodedCallData.values[0].length} token{decodedCallData.values[0].length !== 1 ? "s" : ""}
            </span>
            {detailView ?
              <ul className={css.summaryDetails}>
                {decodedCallData.values[0].map((token: string) => <li key={token}><a href={linkToEtherScan(token)} target="_blank" rel="noopener noreferrer">{token}</a></li>)}
              </ul>
              : ""
            }
          </div>
        );
      case "changeDeadline":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              {decodedCallData.values[1] ? "+" : "-"}&nbsp;
              {decodedCallData.values[1] ? "Whitelist" : "Delist"} {decodedCallData.values[0].length} token{decodedCallData.values[0].length !== 1 ? "s" : ""}
            </span>
            {detailView ?
              <ul className={css.summaryDetails}>
                {decodedCallData.values[0].map((token: string) => <li key={token}><a href={linkToEtherScan(token)} target="_blank" rel="noopener noreferrer">{token}</a></li>)}
              </ul>
              : ""
            }
          </div>
        );
      case "fulfillAndAccept":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              {decodedCallData.values[1] ? "+" : "-"}&nbsp;
              {decodedCallData.values[1] ? "Whitelist" : "Delist"} {decodedCallData.values[0].length} token{decodedCallData.values[0].length !== 1 ? "s" : ""}
            </span>
            {detailView ?
              <ul className={css.summaryDetails}>
                {decodedCallData.values[0].map((token: string) => <li key={token}><a href={linkToEtherScan(token)} target="_blank" rel="noopener noreferrer">{token}</a></li>)}
              </ul>
              : ""
            }
          </div>
        );
      case "replaceApprovers":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              {decodedCallData.values[1] ? "+" : "-"}&nbsp;
              {decodedCallData.values[1] ? "Whitelist" : "Delist"} {decodedCallData.values[0].length} token{decodedCallData.values[0].length !== 1 ? "s" : ""}
            </span>
            {detailView ?
              <ul className={css.summaryDetails}>
                {decodedCallData.values[0].map((token: string) => <li key={token}><a href={linkToEtherScan(token)} target="_blank" rel="noopener noreferrer">{token}</a></li>)}
              </ul>
              : ""
            }
          </div>
        );
      case "replaceIssuers":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              {decodedCallData.values[1] ? "+" : "-"}&nbsp;
              {decodedCallData.values[1] ? "Whitelist" : "Delist"} {decodedCallData.values[0].length} token{decodedCallData.values[0].length !== 1 ? "s" : ""}
            </span>
            {detailView ?
              <ul className={css.summaryDetails}>
                {decodedCallData.values[0].map((token: string) => <li key={token}><a href={linkToEtherScan(token)} target="_blank" rel="noopener noreferrer">{token}</a></li>)}
              </ul>
              : ""
            }
          </div>
        );
      case "updateThresholdNewTokenPair":
      case "updateThresholdNewAuction":
        {
          const field = action.fields[0];
          const value = decodedCallData.values[0];
          return (
            <div className={proposalSummaryClass}>
              <span className={css.summaryTitle}>
                <img src="/assets/images/Icon/edit-sm.svg" />&nbsp;
              {field.label}: {formatTokens(new BN(value), field.unit, field.decimals)}
              </span>
            </div>
          );
        }
      default:
        return "";
    }
  }
}
