import { IGenericPluginProposalState } from "@daostack/arc.js";
import * as classNames from "classnames";
import { GenericPluginInfo } from "genericPluginRegistry";
import { linkToEtherScan, fromWeiToString, truncateWithEllipses } from "lib/util";
import * as React from "react";
import * as css from "./ProposalSummary.scss";
import CopyToClipboard from "components/Shared/CopyToClipboard";

interface IProps {
  genericPluginInfo: GenericPluginInfo;
  detailView?: boolean;
  proposalState: IGenericPluginProposalState;
  transactionModal?: boolean;
}

export default class ProposalSummaryStandardBounties extends React.Component<IProps, null> {

  private rawCallData(proposalState: IGenericPluginProposalState) {
    return <>
      <div>Raw call data:
        {truncateWithEllipses(proposalState.callData, 66)}<CopyToClipboard value={proposalState.callData} />
      </div>
    </>;
  }

  public render(): RenderOutput {

    const { proposalState, detailView, genericPluginInfo, transactionModal } = this.props;
    let decodedCallData: any;

    try {
      decodedCallData = genericPluginInfo.decodeCallData(proposalState.callData);
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
      case "issueAndContribute":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg" className={css.iconPadding} /> {action.label}
            </span>
            {detailView &&
              <div className={css.summaryDetails}>
                <div>
                  Bounty Details: <a href={`https://ipfs.io/ipfs/${decodedCallData.values[3]}`} target="_blank" rel="noopener noreferrer">{decodedCallData.values[3]}</a>.
                </div>
                <div>
                  Deadline: {(new Date(parseInt(decodedCallData.values[4], 10) * 1000)).toString()}.
                </div>
                <div>
                  Amount funded: {fromWeiToString(decodedCallData.values[7])} {decodedCallData.values[6].toString() === "0" ? "ETH" : "tokens"}.
                </div>
                <div>
                  Token Address: <a href={linkToEtherScan(decodedCallData.values[5])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[5]}</a>
                </div>
                <div>
                  Sender: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a>
                </div>
                <div>
                  Issuer: <a href={linkToEtherScan(decodedCallData.values[1])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[1]}</a>
                </div>
                <div>
                  Approver: <a href={linkToEtherScan(decodedCallData.values[2])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[2]}</a>
                </div>
                {this.rawCallData(proposalState)}
              </div>
            }
          </div>
        );
      case "contribute":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg" className={css.iconPadding} /> {action.label}
            </span>
            {detailView &&
              <div className={css.summaryDetails}>
                <div>
                  Contribution Amount: {fromWeiToString(decodedCallData.values[2])}
                </div>
                <div>
                  Bounty ID: {decodedCallData.values[1]}
                </div>
                <div>
                  Sender: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a>
                </div>
                {this.rawCallData(proposalState)}
              </div>
            }
          </div>
        );
      case "refundContributions":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg" className={css.iconPadding} /> {action.label}
            </span>
            {detailView &&
              <div className={css.summaryDetails}>
                <div>
                  Refund for contribution IDs:
                </div>
                <ul>
                  {decodedCallData.values[3].map((addr: string) => (
                    <li key={addr}>
                      <a href={linkToEtherScan(addr)} target="_blank" rel="noopener noreferrer">{addr}</a>
                    </li>
                  ))}
                </ul>
                <div>
                  Sender: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a>
                </div>
                <div>
                  Bounty ID: {decodedCallData.values[1]}
                </div>
                <div>
                  Issuer ID: {decodedCallData.values[2]}
                </div>
                {this.rawCallData(proposalState)}
              </div>
            }
          </div>
        );
      case "drainBounty":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg" className={css.iconPadding} /> {action.label}
            </span>
            {detailView &&
              <div className={css.summaryDetails}>
                <div>
                  Draining {fromWeiToString(decodedCallData.values[3])} amount of tokens for bounty ID {decodedCallData.values[1]}.
                </div>
                <div>
                  Sender: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a>
                </div>
                <div>
                  Issuer ID: {decodedCallData.values[2]}
                </div>
                {this.rawCallData(proposalState)}
              </div>
            }
          </div>
        );
      case "acceptFulfillment":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg" className={css.iconPadding} /> {action.label}
            </span>
            {detailView &&
              <div className={css.summaryDetails}>
                <div>
                  Accepting submission ID {decodedCallData.values[2]} for bounty ID {decodedCallData.values[1]} of {fromWeiToString(decodedCallData.values[4])} tokens.
                </div>
                <div>
                  Sender: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a>
                </div>
                <div>
                  Approver ID: {decodedCallData.values[3]}
                </div>
                {this.rawCallData(proposalState)}
              </div>
            }
          </div>
        );
      case "changeBounty":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg" className={css.iconPadding} /> {action.label}
            </span>
            {detailView &&
              <div className={css.summaryDetails}>
                <div>
                  For Bounty ID {decodedCallData.values[1]},
                </div>
                <div>
                  Change issuers to:
                </div>
                <ul>
                  {decodedCallData.values[3].map((addr: string) => (
                    <li key={addr}>
                      <a href={linkToEtherScan(addr)} target="_blank" rel="noopener noreferrer">{addr}</a>
                    </li>
                  ))}
                </ul>
                <div>
                  Change approvers to:
                </div>
                <ul>
                  {decodedCallData.values[4].map((addr: string) => (
                    <li key={addr}>
                      <a href={linkToEtherScan(addr)} target="_blank" rel="noopener noreferrer">{addr}</a>
                    </li>
                  ))}
                </ul>
                <div>
                  Change bounty details to <a href={`https://ipfs.io/ipfs/${decodedCallData.values[5]}`} target="_blank" rel="noopener noreferrer">{decodedCallData.values[5]}</a>
                </div>
                <div>
                  Change bounty deadline to {(new Date(parseInt(decodedCallData.values[6], 10) * 1000)).toString()}
                </div>
                <div>
                  Sender: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a>
                </div>
                <div>
                  Issuer ID: {decodedCallData.values[2]}
                </div>
                {this.rawCallData(proposalState)}
              </div>
            }
          </div>
        );
      case "changeData":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg" className={css.iconPadding} /> {action.label}
            </span>
            {detailView &&
              <div className={css.summaryDetails}>
                <div>
                  Change details of bounty ID  {decodedCallData.values[1]} to <a href={`https://ipfs.io/ipfs/${decodedCallData.values[3]}`} target="_blank" rel="noopener noreferrer">{decodedCallData.values[3]}</a>.
                </div>
                <div>
                  Sender: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a>
                </div>
                <div>
                  Issuer ID: {decodedCallData.values[2]}
                </div>
                {this.rawCallData(proposalState)}
              </div>
            }
          </div>
        );
      case "changeDeadline":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg" className={css.iconPadding} /> {action.label}
            </span>
            {detailView &&
              <div className={css.summaryDetails}>
                <div>
                  Change deadline of bounty ID {decodedCallData.values[1]} to {(new Date(parseInt(decodedCallData.values[3], 10) * 1000)).toString()}
                </div>
                <div>
                  Sender: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a>
                </div>
                <div>
                  Issuer ID: {decodedCallData.values[2]}
                </div>
                {this.rawCallData(proposalState)}
              </div>
            }
          </div>
        );
      case "fulfillAndAccept":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg" className={css.iconPadding} /> {action.label}
            </span>
            {detailView &&
              <ul className={css.summaryDetails}>
                <div>
                  Accept submission of:
                </div>
                <ul>
                  {decodedCallData.values[2].map((addr: string) => (
                    <li key={addr}>
                      <a href={linkToEtherScan(addr)} target="_blank" rel="noopener noreferrer">{addr}</a>
                    </li>
                  ))}
                </ul>
                <div>
                  and send {fromWeiToString(decodedCallData.values[5])} tokens for bounty ID {decodedCallData.values[1]}.
                </div>
                <div>
                  Sender: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a>
                </div>
                <div>
                  Approver ID: {decodedCallData.values[4]}
                </div>
                <div>
                  Bounty Details: <a href={`https://ipfs.io/ipfs/${decodedCallData.values[3]}`} target="_blank" rel="noopener noreferrer">{decodedCallData.values[3]}</a>
                </div>
                {this.rawCallData(proposalState)}
              </ul>
            }
          </div>
        );
      case "replaceApprovers":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg" className={css.iconPadding} /> {action.label}
            </span>
            {detailView &&
              <div className={css.summaryDetails}>
                <div>
                  Change approvers to:
                </div>
                <ul>
                  {decodedCallData.values[3].map((addr: string) => (
                    <li key={addr}>
                      <a href={linkToEtherScan(addr)} target="_blank" rel="noopener noreferrer">{addr}</a>
                    </li>
                  ))}
                </ul>
                <div>
                  Bounty ID: {decodedCallData.values[1]}
                </div>
                <div>
                  Sender: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a>
                </div>
                <div>
                  Issuer ID: {decodedCallData.values[2]}
                </div>
                {this.rawCallData(proposalState)}
              </div>
            }
          </div>
        );
      case "replaceIssuers":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg" className={css.iconPadding} /> {action.label}
            </span>
            {detailView &&
              <div className={css.summaryDetails}>
                <div>
                  Change issuers to:
                </div>
                <ul>
                  {decodedCallData.values[3].map((addr: string) => (
                    <li key={addr}>
                      <a href={linkToEtherScan(addr)} target="_blank" rel="noopener noreferrer">{addr}</a>
                    </li>
                  ))}
                </ul>
                <div>
                  Bounty ID: {decodedCallData.values[1]}
                </div>
                <div>
                  Sender: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a>
                </div>
                <div>
                  Issuer ID: {decodedCallData.values[2]}
                </div>
                {this.rawCallData(proposalState)}
              </div>
            }
          </div>
        );
      default:
        return "";
    }
  }
}
