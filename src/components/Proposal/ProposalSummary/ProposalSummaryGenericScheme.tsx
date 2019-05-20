import { IDAOState, IProposalState } from "@daostack/client";
import * as classNames from "classnames";
import {getNetworkName } from "lib/util";
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
  network: string;
  // actions: Action[];
  genericSchemeInfo: GenericSchemeInfo;
}

export default class ProposalSummary extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
    const genericSchemeRegistry = new GenericSchemeRegistry();
    // // TODO: make this generic (NOT specific to the dxDAO)
    const genericSchemeInfo = genericSchemeRegistry.genericSchemeInfo("dxDAO");
    // const actions = genericSchemeInfo.actions();

    this.state = {
      // actions,
      genericSchemeInfo,
      network: ""
    };
  }

  public async componentWillMount() {
    this.setState({ network: (await getNetworkName()).toLowerCase() });
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
      // TOOD: notifiy, not alert!
      alert(err);
    }
    console.log(decodedCallData);
    return <div className={proposalSummaryClass}>
      Calling function { decodedCallData.action.abi.name}  with values { decodedCallData.values.map((value: any) => <div key={value}>{value}</div>) }
    </div>;
  }
}
