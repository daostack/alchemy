import { IProposalState } from "@daostack/client";

import classNames from "classnames";
import { GenericSchemeInfo } from "genericSchemeRegistry";
import * as React from "react";
import * as css from "./ProposalSummary.scss";

interface IProps {
  genericSchemeInfo: GenericSchemeInfo;
  detailView?: boolean;
  proposal: IProposalState;
  transactionModal?: boolean;
}

export default class ProposalSummaryCO2ken extends React.Component<IProps, null> {

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
      case "mint": {
        const ipfsHashValue = decodedCallData.values[0];
        const amountTokensValue = decodedCallData.values[1];
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              {action.label}
            </span>
            { detailView ?
              <div className={css.summaryDetails}>
                <div>
                  <p>
                    Executing this proposal will mint a total of:
                    <pre>{amountTokensValue} new CO2kens</pre>
                  </p>
                  <p>
                    Before voting on this proposal, verify that the passed IPFS hash is a valid certificate.
                    Click on the hash below to see the certificate:
                    <pre>
                      <a href={`https://cloudflare-ipfs.com/ipfs/${ipfsHashValue}`} target="_blank" rel="noopener noreferrer">{ipfsHashValue}</a>
                    </pre>
                  </p>
                </div>
              </div>
              : ""
            }
          </div>
        );
      }
      case "approve":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              {action.label}
            </span>
            {detailView ?
              <div className={css.summaryDetails}>
                Executing this proposal will call the function
                <pre>{action.id}()</pre>
                with value
                <pre>{-1}</pre>
                It allows the the CO2ken contract to move DAI held by the DAO. This way, the DAO can offset its emissions by calling:
                <pre>offsetCarbon()</pre>
              </div>
              : ""
            }
          </div>
        );
      case "withdraw":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              {action.label}
            </span>
            {detailView ?
              <div className={css.summaryDetails}>
                Executing this proposal will call the function
                <pre>{action.id}()</pre>
                It transfers all the DAI stored in the CO2ken contract to the DAO.
              </div>
              : ""
            }
          </div>
        );
      case "offsetCarbon":
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              {action.label}
            </span>
            {detailView ?
              <div className={css.summaryDetails}>
                Executing this proposal will call the function
                <pre>{action.id}()</pre>
                with value
                <pre>{decodedCallData.values[0]}</pre>
                The value describes the amount of DAI (with 18 decimals) that are sent to the CO2ken contract to offset a relative amount of the DAO‘s carbon emissions.
              </div>
              : ""
            }
          </div>
        );
      case "offsetCarbonTons":
      {
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              {action.label}
            </span>
            {detailView ?
              <div className={css.summaryDetails}>
                Executing this proposal will call the function
                <pre>{action.id}()</pre>
                with value
                <pre>{decodedCallData.values[0]}</pre>
                The value describes the amount of carbon tons (with 18 decimals) the DAO wants to offset.
              </div>
              : ""
            }
          </div>
        );
      }
      case "transferOwnership":
      {
        return (
          <div className={proposalSummaryClass}>
            <span className={css.summaryTitle}>
              {action.label}
            </span>
            {detailView ?
              <div className={css.summaryDetails}>
                Executing this proposal will call the function
                <pre>{action.id}()</pre>
                with the new owner‘s address being
                <pre>{decodedCallData.values[0]}</pre>
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
