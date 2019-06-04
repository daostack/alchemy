import { linkToEtherScan } from "lib/util";
import * as React from "react";
import * as css from "./ProposalSummary.scss";

interface IProps {
  callData: any;
  detailView?: boolean;
}

export default class ProposalSummaryDutchX extends React.Component<IProps, null> {

  public render() {
    const { callData, detailView } = this.props;

    switch (callData.action.id) {
      case "updateMasterCopy":
        return (
          <div>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg"/>&nbsp;
              Update Mastercopy
            </span>
            { detailView ?
              <div className={css.summaryDetails}>
                New master copy address: <a href={linkToEtherScan(callData.values[0])} target="_blank">{callData.values[0]}</a>
              </div>
              : ""
            }
          </div>
        );
      case "changeETHUSDOracle":
        return (
          <div>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg"/>&nbsp;
              Change ETH:USD oracle
            </span>
            { detailView ?
              <div className={css.summaryDetails}>
                New oracle address: <a href={linkToEtherScan(callData.values[0])} target="_blank">{callData.values[0]}</a>
              </div>
              : ""
            }
          </div>
        );
      case "updateAuctioneer":
        return (
          <div>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg"/>&nbsp;
              Change DutchX owner
            </span>
            { detailView ?
              <div className={css.summaryDetails}>
                New owner address: <a href={linkToEtherScan(callData.values[0])} target="_blank">{callData.values[0]}</a>
              </div>
              : ""
            }
          </div>
        );
      case "addOrRemoveTokens":
        return (
          <div>
            <span className={css.summaryTitle}>
              {callData.values[1] ? "+" : "-"}&nbsp;
              {callData.values[1] ? "Whitelist" : "Delist"} {callData.values[0].length} token{callData.values[0].length !== 1 ? "s" : ""}
            </span>
            { detailView ?
              <ul className={css.summaryDetails}>
                {callData.values[0].map((token: string) => <li key={token}><a href={linkToEtherScan(token)} target="_blank">{token}</a></li>)}
              </ul>
              : ""
            }
          </div>
        );
      case "updateThresholdNewTokenPair":
        return (
          <div>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg"/>&nbsp;
              Set new token pair threshold to ${callData.values[0]}
            </span>
          </div>
        );
      case "updateThresholdNewAuction":
        return (
          <div>
            <span className={css.summaryTitle}>
              <img src="/assets/images/Icon/edit-sm.svg"/>&nbsp;
              Set new auction threshold to ${callData.values[0]}
            </span>
          </div>
        );
      default:
        return "";
    }
  }
}
