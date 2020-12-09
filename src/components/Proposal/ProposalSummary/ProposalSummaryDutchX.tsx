import { IProposalState } from "@daostack/arc.js";

import * as BN from "bn.js";
import classNames from "classnames";
import { GenericSchemeInfo } from "genericSchemeRegistry";
import { formatTokens, getNetworkByDAOAddress, linkToEtherScan, truncateWithEllipses } from "lib/util";
import * as React from "react";
import * as css from "./ProposalSummary.scss";
import CopyToClipboard from "components/Shared/CopyToClipboard";

interface IProps {
  genericSchemeInfo: GenericSchemeInfo;
  detailView?: boolean;
  proposal: IProposalState;
  transactionModal?: boolean;
}

export default class ProposalSummaryDutchX extends React.Component<IProps, null> {

  private rawCallData(proposal: IProposalState) {
    return <>
      <p>Raw call data:</p>
      <pre>
        {truncateWithEllipses(proposal.genericScheme.callData, 66)}<CopyToClipboard value={proposal.genericScheme.callData} />
      </pre>
    </>;
  }


  public render(): RenderOutput {
    const { proposal, detailView, genericSchemeInfo, transactionModal } = this.props;
    const network = getNetworkByDAOAddress(proposal.dao.id);
    let decodedCallData: any;
    const sendsETH = proposal.genericScheme.value.gtn(0);
    const renderValueHtml = () => {
      return sendsETH ?
        <div className={sendsETH ? css.warning : ""}>
          &gt; Send to contract: {formatTokens(proposal.genericScheme.value)} ETH &lt;
        </div>
        : "";
    };
    try {
      decodedCallData = genericSchemeInfo.decodeCallData(proposal.genericScheme.callData);
    } catch (err) {
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
      case "updateMasterCopy":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg"/>&nbsp;
              {action.label}
              {renderValueHtml()}
            </span>
            { detailView ?
              <div className={css.summaryDetails}>
                <div>{ action.fields[0].label}: <a href={linkToEtherScan(decodedCallData.values[0], network)} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a></div>
                {this.rawCallData(proposal)}
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
              {action.label}
              {renderValueHtml()}
            </span>
            { detailView ?
              <div className={css.summaryDetails}>
                New oracle address: <a href={linkToEtherScan(decodedCallData.values[0], network)} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a>
                {this.rawCallData(proposal)}
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
              {action.label}
              {renderValueHtml()}
            </span>
            { detailView ?
              <div className={css.summaryDetails}>
                New owner address: <a href={linkToEtherScan(decodedCallData.values[0], network)} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a>
                {this.rawCallData(proposal)}
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
              {renderValueHtml()}
            </span>
            { detailView ?
              <div className={css.summaryDetails}>
                <ul>
                  {decodedCallData.values[0].map((token: string) => <li key={token}><a href={linkToEtherScan(token, network)} target="_blank" rel="noopener noreferrer">{token}</a></li>)}
                </ul>
                {this.rawCallData(proposal)}
              </div>
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
              <img src="/assets/images/Icon/edit-sm.svg"/>&nbsp;
              { field.label }: {formatTokens(new BN(value), field.unit, field.decimals)}
              {renderValueHtml()}
            </span>
            {detailView ?
              <div className={css.summaryDetails}>
                {this.rawCallData(proposal)}
              </div>
              : ""
            }
          </div>
        );
      }
      default:
        return "";
    }
  }
}
