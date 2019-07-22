import { IDAOState, IProposalState } from "@daostack/client";
import * as classNames from "classnames";
import { GenericSchemeInfo } from "genericSchemeRegistry";
import { linkToEtherScan, formatTokens } from "lib/util";
import * as React from "react";
import { IProfileState } from "reducers/profilesReducer";
import * as css from "./ProposalSummary.scss";

import BN = require("bn.js");

interface IProps {
  beneficiaryProfile?: IProfileState;
  detailView?: boolean;
  dao: IDAOState;
  proposal: IProposalState;
  transactionModal?: boolean;
  genericSchemeInfo: GenericSchemeInfo;
}

export default class ProposalSummary extends React.Component<IProps> {

  constructor(props: IProps) {
    super(props);
  }

  public render(): any {
    const { proposal, detailView, transactionModal, genericSchemeInfo } = this.props;

    return this.renderFormSummary(genericSchemeInfo, proposal, detailView, transactionModal);
    
    // const proposalSummaryClass = classNames({
    //   [css.detailView]: detailView,
    //   [css.transactionModal]: transactionModal,
    //   [css.proposalSummary]: true,
    //   [css.withDetails]: true,
    // });
    // let decodedCallData: any;
    // try {
    //   decodedCallData = genericSchemeInfo.decodeCallData(proposal.genericScheme.callData);
    // } catch (err) {
    //   return (
    //     <div className={proposalSummaryClass}>
    //       <span className={css.summaryTitle}>Unknown function call</span>
    //       {detailView ?
    //         <div className={css.summaryDetails}>
    //           to contract at <a href={linkToEtherScan(proposal.genericScheme.contractToCall)}>{proposal.genericScheme.contractToCall.substr(0, 8)}...</a>
    //           with callData: <pre>{proposal.genericScheme.callData}</pre>
    //         </div>
    //         : ""
    //       }
    //     </div>
    //   );
    // }

    // return <div className={proposalSummaryClass}>
    //   <span className={css.summaryTitle}>
    //     <img src="/assets/images/Icon/edit-sm.svg"/>&nbsp;
    //     { decodedCallData.action.label }
    //   </span>

    //   {detailView ?
    //     <div className={css.summaryDetails}>
    //       Calling function { decodedCallData.action.abi.name} with values { decodedCallData.values.map((value: any): any => <div key={value}>{value}</div>) }
    //     </div>
    //     : ""
    //   }
    // </div>;
  }

  public renderFormSummary(
    genericSchemeInfo: GenericSchemeInfo,
    proposal: IProposalState,
    detailView?: boolean,
    transactionModal?: boolean,
  ): any {
    const decodedCallData = genericSchemeInfo.decodeCallData(proposal.genericScheme.callData);
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
            </span>
            { detailView ?
              <div className={css.summaryDetails}>
                { action.fields[0].label}: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a>
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
            </span>
            { detailView ?
              <div className={css.summaryDetails}>
                New oracle address: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a>
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
            </span>
            { detailView ?
              <div className={css.summaryDetails}>
                New owner address: <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a>
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
                {decodedCallData.values[0].map((token: string): any => <li key={token}><a href={linkToEtherScan(token)} target="_blank" rel="noopener noreferrer">{token}</a></li>)}
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
              <img src="/assets/images/Icon/edit-sm.svg"/>&nbsp;
              { field.label }: {formatTokens(new BN(value), field.unit, field.decimals)}
            </span>
          </div>
        );
      }
      default:
        return "";
    }
  }
}
