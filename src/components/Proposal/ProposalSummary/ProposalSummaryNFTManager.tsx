import { IGenericPluginProposalState, IDAOState } from "@dorgtech/arc.js";
import * as classNames from "classnames";
import { GenericPluginInfo } from "genericPluginRegistry";
import { linkToEtherScan } from "lib/util";
import * as React from "react";
import * as css from "./ProposalSummary.scss";
const Web3 = require("web3");

interface IProps {
  genericPluginInfo: GenericPluginInfo;
  detailView?: boolean;
  proposalState: IGenericPluginProposalState;
  transactionModal?: boolean;
  daoState: IDAOState;
}

export default class ProposalSummaryNFTManager extends React.Component<IProps, null> {

  public render(): RenderOutput {

    const { proposalState, detailView, genericPluginInfo, transactionModal } = this.props;
    let decodedCallData: any;
    let decodedParams: any;

    try {
      decodedCallData = genericPluginInfo.decodeCallData(proposalState.callData);
      // Fix for previous functions' failure to decode parameters
      const web3 = new Web3();
      decodedParams = web3.eth.abi.decodeParameters([...decodedCallData.action.abi.inputs.map((input: { type: any }) => input.type)], "0x" + proposalState.callData.slice(2 + 8));
      decodedCallData.values = decodedParams;
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
      case "sendNFT":
        return (
          <div className={proposalSummaryClass}>
            {!detailView &&
              <span className={css.summaryTitle}>
                <strong>Send NFT </strong>
                <img className={css.iconPadding} src="/assets/images/Icon/Transfer.svg" />
                {decodedCallData.values[0]}
              </span>
            }
            { detailView &&
              <div className={css.summaryDetails}>
                <div>
                  <strong>Send NFT </strong>
                  <img className={css.iconPadding} src="/assets/images/Icon/Transfer.svg" />
                  <a href={linkToEtherScan(decodedCallData.values[0])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[0]}</a>
                </div>
                <br/>
                <div>
                  <strong>NFT Contract:</strong> <a href={linkToEtherScan(decodedCallData.values[1])} target="_blank" rel="noopener noreferrer">{decodedCallData.values[1]}</a>
                </div>
                <div>
                  <strong>TokenID:</strong> {decodedCallData.values[2]}
                </div>
              </div>
            }
          </div>
        );
      default:
        return "";
    }
  }
}
