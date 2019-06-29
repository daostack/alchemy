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

    const proposalSummaryClass = classNames({
      [css.detailView]: detailView,
      [css.transactionModal]: transactionModal,
      [css.proposalSummary]: true,
      [css.withDetails]: true
    });

    switch (decodedCallData.action.id) {
      case "updateMasterCopy":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg"/>&nbsp;
              Update Mastercopy
            </span>
            { detailView ?
              <div className={css.summaryDetails}>
                New master copy address: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank">{decodedCallData.values[0]}</a>
              </div>
              : ""
            }
          </div>
        );
      case "changeETHUSDOracle":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg"/>&nbsp;
              Change ETH:USD oracle
            </span>
            { detailView ?
              <div className={css.summaryDetails}>
                New oracle address: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank">{decodedCallData.values[0]}</a>
              </div>
              : ""
            }
          </div>
        );
      case "updateAuctioneer":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg"/>&nbsp;
              Change DutchX owner
            </span>
            { detailView ?
              <div className={css.summaryDetails}>
                New owner address: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank">{decodedCallData.values[0]}</a>
              </div>
              : ""
            }
          </div>
        );
      case "updateApprovalOfToken":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              {decodedCallData.values[1] ? "+" : "-"}&nbsp;
              {decodedCallData.values[1] ? "Whitelist" : "Delist"} {decodedCallData.values[0].length} token{decodedCallData.values[0].length !== 1 ? "s" : ""}
            </span>
            { detailView ?
              <ul className={css.summaryDetails}>
                {decodedCallData.values[0].map((token: string) => <li key={token}><a href={linkToEtherScan(token)} target="_blank">{token}</a></li>)}
              </ul>
              : ""
            }
          </div>
        );
      case "updateThresholdNewTokenPair":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg"/>&nbsp;
              Set new token pair threshold to ${formatTokens(new BN(decodedCallData.values[0]))}
            </span>
          </div>
        );
      case "updateThresholdNewAuction":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg"/>&nbsp;
              Set new auction threshold to ${formatTokens(new BN(decodedCallData.values[0]))}
            </span>
          </div>
        );
      default:
        return "";
    }
  }
}
