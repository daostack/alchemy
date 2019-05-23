import { IDAOState, IProposalState } from "@daostack/client";
import * as classNames from "classnames";
import { linkToEtherScan } from "lib/util";
import * as React from "react";
import { IProfileState } from "reducers/profilesReducer";
import { GenericSchemeInfo, GenericSchemeRegistry} from "../../../genericSchemeRegistry";
import * as css from "./ProposalSummary.scss";

interface IProps {
  beneficiaryProfile?: IProfileState;
  detailView?: boolean;
  dao: IDAOState;
  proposal: IProposalState;
  transactionModal?: boolean;
}

interface IState {
  genericSchemeInfo: GenericSchemeInfo;
}

export default class ProposalSummary extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
    const genericSchemeRegistry = new GenericSchemeRegistry();
    // // TODO: make this generic (NOT specific to the dxDAO)
    const genericSchemeInfo = genericSchemeRegistry.genericSchemeInfo("dxDAO");

    this.state = {
      genericSchemeInfo
    };
  }

  public render() {
    const { proposal, detailView, transactionModal } = this.props;
    const proposalSummaryClass = classNames({
      [css.detailView]: detailView,
      [css.transactionModal]: transactionModal,
      [css.proposalSummary]: true,
    });
    let decodedCallData: any;
    try {
      decodedCallData = this.state.genericSchemeInfo.decodeCallData(proposal.genericScheme.callData);
    } catch (err) {
      // TODO: we should only show this info when we cannot find any decodedCallData
      return (
        <div className={proposalSummaryClass}>Unknown function call
        to contract at <a href={linkToEtherScan(proposal.genericScheme.contractToCall)}>{proposal.genericScheme.contractToCall.substr(0, 8)}...</a>
        with callData: <pre>{proposal.genericScheme.callData}</pre>
        </div>
      );
    }
    console.log(decodedCallData);
    return <div className={proposalSummaryClass}>
      .... { decodedCallData.action.label}....
      Calling function { decodedCallData.action.abi.name}  with values { decodedCallData.values.map((value: any) => <div key={value}>{value}</div>) }
    </div>;
  }
}
