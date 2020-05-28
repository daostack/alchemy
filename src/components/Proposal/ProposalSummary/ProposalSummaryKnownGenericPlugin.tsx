import { IDAOState, IGenericPluginProposalState } from "@dorgtech/arc.js";
import classNames from "classnames";
import { GenericPluginInfo } from "genericPluginRegistry";
import { linkToEtherScan } from "lib/util";
import * as React from "react";
import { IProfileState } from "reducers/profilesReducer";
import * as css from "./ProposalSummary.scss";
import ProposalSummaryDutchX from "./ProposalSummaryDutchX";
import ProposalSummaryStandardBounties from "./ProposalSummaryStandardBounties";
import ProposalSummaryCO2ken from "./ProposalSummaryCO2ken";
import ProposalSummaryNFTManager from "./ProposalSummaryNFTManager";

interface IProps {
  beneficiaryProfile?: IProfileState;
  detailView?: boolean;
  daoState: IDAOState;
  proposalState: IGenericPluginProposalState;
  transactionModal?: boolean;
  genericPluginInfo: GenericPluginInfo;
}

export default class ProposalSummary extends React.Component<IProps> {

  constructor(props: IProps) {
    super(props);
  }

  private inputHtml = (x: any) => <span key={x.name}>{x.name} {x.type}, </span>;
  private callDataHtml = (value: any) => <div key={value}>{value}</div>;


  public render(): RenderOutput {
    const { proposalState, detailView, transactionModal, genericPluginInfo } = this.props;
    if (genericPluginInfo.specs.name === "DutchX") {
      return <ProposalSummaryDutchX {...this.props} />;
    } else if (genericPluginInfo.specs.name === "Standard Bounties") {
      return <ProposalSummaryStandardBounties {...this.props} />;
    } else if (genericPluginInfo.specs.name === "CO2ken") {
      return <ProposalSummaryCO2ken {...this.props} />;
    } else if (genericPluginInfo.specs.name === "NFTManager") {
      return <ProposalSummaryNFTManager {...this.props} />;
    }
    const proposalSummaryClass = classNames({
      [css.detailView]: detailView,
      [css.transactionModal]: transactionModal,
      [css.proposalSummary]: true,
      [css.withDetails]: true,
    });
    let decodedCallData: any;
    try {
      decodedCallData = genericPluginInfo.decodeCallData(proposalState.callData);
    } catch (err) {
      return (
        <div className={proposalSummaryClass}>
          <span className={css.summaryTitle}>Unknown function call</span>
          {detailView ?
            <div className={css.summaryDetails}>
              to contract at <a href={linkToEtherScan(proposalState.contractToCall)}>{proposalState.contractToCall.substr(0, 8)}...</a>
              with callData: <pre>{proposalState.callData}</pre>
            </div>
            : ""
          }
        </div>
      );
    }

    return <div className={proposalSummaryClass}>
      <span className={css.summaryTitle}>
        <img src="/assets/images/Icon/edit-sm.svg"/>&nbsp;
        { decodedCallData.action.label }
      </span>

      {detailView ?
        <div className={css.summaryDetails}>
          Executing this proposal will call the function
          <pre>{ decodedCallData.action.abi.name}
        ({ decodedCallData.action.abi.inputs.map(this.inputHtml) })
          </pre>
          with values <pre>{ decodedCallData.values.map(this.callDataHtml)}</pre>
          on contract at
          <pre><a href={linkToEtherScan(proposalState.contractToCall)}>{proposalState.contractToCall}</a></pre>
        </div>
        : ""
      }
    </div>;
  }
}
