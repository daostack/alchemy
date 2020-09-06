import {
  IDAOState,
  AnyProposal,
  IContributionRewardProposalState,
  IGenericPluginProposalState,
  IPluginRegistrarProposalState,
  IProposalState,
  Proposal,
  IPluginManagerProposalState,
  IFundingRequestProposalState,
  IJoinProposalState } from "@daostack/arc.js";
import classNames from "classnames";
import { GenericPluginRegistry } from "genericPluginRegistry";
import * as React from "react";
import { IProfileState } from "reducers/profilesReducer";
import * as css from "./ProposalSummary.scss";
import ProposalSummaryContributionReward from "./ProposalSummaryContributionReward";
import ProposalSummaryKnownGenericPlugin from "./ProposalSummaryKnownGenericPlugin";
import ProposalSummaryPluginRegistrar from "./ProposalSummaryPluginRegistrar";
import ProposalSummaryPluginManager from "./ProposalSummaryPluginManager";
import ProposalSummaryUnknownGenericPlugin from "./ProposalSummaryUnknownGenericPlugin";
import ProposalSummaryJoin from "./ProposalSummaryJoin";
import ProposalSummaryFundingRequest from "./ProposalSummaryFundingRequest";
import { getArc } from "arc";

interface IProps {
  beneficiaryProfile?: IProfileState;
  detailView?: boolean;
  daoState: IDAOState;
  proposalState: IProposalState;
  transactionModal?: boolean;
}

interface IState {
  proposal: AnyProposal;
}

export default class ProposalSummary extends React.Component<IProps, IState> {

  public async componentDidMount(): Promise<void> {
    this.setState({
      proposal: await Proposal.create(getArc(), this.props.proposalState.id),
    });
  }

  public render(): RenderOutput {

    if (!this.state) {
      return null;
    }

    const { detailView, transactionModal } = this.props;
    const { proposal } = this.state;

    const proposalSummaryClass = classNames({
      [css.detailView]: detailView,
      [css.transactionModal]: transactionModal,
      [css.proposalSummary]: true,
    });

    if (proposal.coreState.name === "ContributionReward") {
      const state = proposal.coreState as IContributionRewardProposalState;
      return <ProposalSummaryContributionReward {...this.props} proposalState={state} />;
    } else if (proposal.coreState.name.includes("SchemeRegistrar")) {
      const state = proposal.coreState as IPluginRegistrarProposalState;
      return <ProposalSummaryPluginRegistrar {...this.props} proposalState={state} />;
    } else if (proposal.coreState.name.includes("SchemeFactory")) {
      const state = proposal.coreState as IPluginManagerProposalState;
      return <ProposalSummaryPluginManager {...this.props} proposalState={state} />;
    } else if (proposal.coreState.name === "GenericScheme") {
      const state = proposal.coreState as IGenericPluginProposalState;
      const genericPluginRegistry = new GenericPluginRegistry();
      const genericPluginInfo = genericPluginRegistry.getPluginInfo(state.contractToCall);
      if (genericPluginInfo) {
        return <ProposalSummaryKnownGenericPlugin {...this.props} proposalState={state} genericPluginInfo={genericPluginInfo} />;
      } else {
        return <ProposalSummaryUnknownGenericPlugin {...this.props} proposalState={state} />;
      }
    } else if (proposal.coreState.name === "Join"){
      const state = proposal.coreState as IJoinProposalState;
      return <ProposalSummaryJoin {...this.props} proposalState={state} />;
    } else if (proposal.coreState.name === "FundingRequest") {
      const state = proposal.coreState as IFundingRequestProposalState;
      return <ProposalSummaryFundingRequest {...this.props} proposalState={state} />;
    } else {
      return <div className={proposalSummaryClass}>Unknown proposal type</div>;
    }
  }
}
