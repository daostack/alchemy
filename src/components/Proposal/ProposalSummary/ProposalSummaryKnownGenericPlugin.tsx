import { IDAOState, IGenericPluginProposalState } from "@daostack/arc.js";
import classNames from "classnames";
import { GenericPluginInfo } from "genericPluginRegistry";
import { linkToEtherScan, truncateWithEllipses, formatTokens } from "lib/util";
import CopyToClipboard from "components/Shared/CopyToClipboard";
import * as React from "react";
import { IProfileState } from "reducers/profilesReducer";
import * as css from "./ProposalSummary.scss";
import ProposalSummaryDutchX from "./ProposalSummaryDutchX";
import ProposalSummaryStandardBounties from "./ProposalSummaryStandardBounties";
import ProposalSummaryCO2ken from "./ProposalSummaryCO2ken";
import ProposalSummaryNFTManager from "./ProposalSummaryNFTManager";

interface IExternalProps {
  beneficiaryProfile?: IProfileState;
  detailView?: boolean;
  daoState: IDAOState;
  proposalState: IGenericPluginProposalState;
  transactionModal?: boolean;
  genericPluginInfo: GenericPluginInfo;
}

type IProps = IExternalProps;

export default class ProposalSummary extends React.Component<IProps> {

  private inputHtml = (x: any) => <span key={x.name}>{x.name} {x.type}, </span>;
  private callDataHtml = (value: any, isArrayItem = false) => {
    if (value?.length > 66) {

      const truncatedValue = truncateWithEllipses(value, 66);

      return <div
        className={isArrayItem ? css.arrayItem : ""}
        key={value}
      >{truncatedValue}<CopyToClipboard value={value}/>{isArrayItem ? "," : ""}
      </div>;

    } else {
      return <div className={isArrayItem ? css.arrayItem : ""} key={value}>{value}{isArrayItem ? "," : ""}</div>;
    }
  }

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
    const sendsETH = proposalState.value.gtn(0);

    try {
      decodedCallData = genericPluginInfo.decodeCallData(proposalState.callData);
    } catch (err) {
      return (
        <div className={proposalSummaryClass}>
          <span className={css.summaryTitle}>Unknown function call
            {sendsETH ?
              <div className={css.warning}>&gt; Sending {formatTokens(proposalState.value)} ETH &lt;</div>
              : ""
            }
          </span>
          {detailView ?
            <div className={css.summaryDetails}>
              To contract at: <pre><a href={linkToEtherScan(proposalState.contractToCall)} target="_blank" rel="noopener noreferrer">{proposalState.contractToCall}</a></pre>
              with callData: <pre>{truncateWithEllipses(proposalState.callData, 42)}<CopyToClipboard value={proposalState.callData} /></pre>
            </div>
            : ""
          }
        </div>
      );
    }

    return <div className={proposalSummaryClass}>
      <span className={css.summaryTitle}>
        <img src="/assets/images/Icon/edit-sm.svg" />&nbsp;
        {decodedCallData.action.label}

        {sendsETH ?
          <div className={css.warning}>&gt; Sending {formatTokens(proposalState.value)} ETH &lt;</div>
          : ""
        }
      </span>

      {detailView ?
        <div className={css.summaryDetails}>
          Executing this proposal will call the function:
          <pre>{decodedCallData.action.abi.name}
            ({decodedCallData.action.abi.inputs.map(this.inputHtml)})
          </pre>
          with values:
          <pre>{
            decodedCallData.values.map((value: string | Array<string>) => {
              if (value instanceof Array) {
                return <>
                  <span>[</span>
                  {value.map((value: string) => this.callDataHtml(value, true))}
                  <span>]</span>
                </>;
              } else {
                return this.callDataHtml(value);
              }
            })}
          </pre>
          on contract at:
          <pre><a href={linkToEtherScan(proposalState.contractToCall)}>{proposalState.contractToCall}</a></pre>
          sending to contract:
          <pre className={sendsETH ? css.warning : ""}>{formatTokens(proposalState.value)} ETH</pre>
        </div>
        : ""
      }
    </div>;
  }
}
