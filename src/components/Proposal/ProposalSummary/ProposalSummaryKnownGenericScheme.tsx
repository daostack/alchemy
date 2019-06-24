import { IDAOState, IProposalState } from "@daostack/client";
import * as classNames from "classnames";
import { GenericSchemeInfo } from "genericSchemeRegistry";
import { linkToEtherScan } from "lib/util";
import * as React from "react";
import { IProfileState } from "reducers/profilesReducer";
import * as css from "./ProposalSummary.scss";
import ProposalSummaryDutchX from "./ProposalSummaryDutchX";

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

  public render() {
    const { proposal, detailView, transactionModal, genericSchemeInfo } = this.props;
    // TODO: having this special case in the code for the DutchX scheme (and having a custom component for it)
    // break the "generate the scheme forms from the DutchX.json file" idea
    // we should try instead to generate this same UI using the json file, and drop the next 3 lines
    if (genericSchemeInfo.specs.name === "DutchX") {
      return <ProposalSummaryDutchX {...this.props} />;
    }
    const proposalSummaryClass = classNames({
      [css.detailView]: detailView,
      [css.transactionModal]: transactionModal,
      [css.proposalSummary]: true,
      [css.withDetails]: true
    });
    let decodedCallData: any;
    try {
      decodedCallData = genericSchemeInfo.decodeCallData(proposal.genericScheme.callData);
    } catch (err) {
      // TODO: we should only show this info when we cannot find any decodedCallData
      return (
        <div className={proposalSummaryClass}>
          <span className={css.summaryTitle}>Unknown function call</span>
          {detailView ?
            <div className={css.summaryDetails}>
              to contract at <a href={linkToEtherScan(proposal.genericScheme.contractToCall)}>{proposal.genericScheme.contractToCall.substr(0, 8)}...</a>
              with callData: <pre>{proposal.genericScheme.callData}</pre>
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
          Calling function { decodedCallData.action.abi.name} with values { decodedCallData.values.map((value: any) => <div key={value}>{value}</div>) }
        </div>
        : ""
      }
    </div>;
  }
}
