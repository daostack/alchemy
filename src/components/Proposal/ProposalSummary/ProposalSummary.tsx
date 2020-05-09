import { IDAOState, AnyProposal, IContributionRewardProposalState, IGenericPluginProposalState, ISchemeRegistrarProposalState } from "@daostack/arc.js";
import classNames from "classnames";
import { GenericPluginRegistry } from "genericPluginRegistry";
import * as React from "react";
import { IProfileState } from "reducers/profilesReducer";
import * as css from "./ProposalSummary.scss";
import ProposalSummaryContributionReward from "./ProposalSummaryContributionReward";
import ProposalSummaryKnownGenericPlugin from "./ProposalSummaryKnownGenericPlugin";
import ProposalSummaryPluginRegistrar from "./ProposalSummaryPluginRegistrar";
import ProposalSummaryUnknownGenericPlugin from "./ProposalSummaryUnknownGenericPlugin";

interface IProps {
  beneficiaryProfile?: IProfileState;
  detailView?: boolean;
  daoState: IDAOState;
  proposal: AnyProposal;
  transactionModal?: boolean;
}

export default class ProposalSummary extends React.Component<IProps> {

  public async componentDidMount() {
    await this.props.proposal.fetchState();
  }

  public render(): RenderOutput {

    const { proposal, detailView, transactionModal } = this.props;

    const proposalSummaryClass = classNames({
      [css.detailView]: detailView,
      [css.transactionModal]: transactionModal,
      [css.proposalSummary]: true,
    });

    if (proposal.coreState.name === "ContributionReward") {
      const state = proposal.coreState as IContributionRewardProposalState;
      return <ProposalSummaryContributionReward {...this.props} proposalState={state} />;
    } else if (proposal.coreState.name.includes("SchemeRegistrar")) {
      const state = proposal.coreState as ISchemeRegistrarProposalState;
      return <ProposalSummaryPluginRegistrar {...this.props} proposalState={state} />;
    } else if (proposal.coreState.name === "GenericScheme") {
      const state = proposal.coreState as IGenericPluginProposalState;
      const genericPluginRegistry = new GenericPluginRegistry();
      const genericPluginInfo = genericPluginRegistry.getPluginInfo(state.contractToCall);
      if (genericPluginInfo) {
        return <ProposalSummaryKnownGenericPlugin  {...this.props} proposalState={state} genericPluginInfo={genericPluginInfo} />;
      } else {
        return <ProposalSummaryUnknownGenericPlugin {...this.props} proposalState={state} />;
      }
    } else {
      return <div className={proposalSummaryClass}>Unknown proposal type</div>;
    }
  }
}
