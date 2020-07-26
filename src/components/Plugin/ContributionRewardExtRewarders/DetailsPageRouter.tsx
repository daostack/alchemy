import { RouteComponentProps } from "react-router";
import * as React from "react";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { getArc } from "arc";
import { IDAOState, IContributionRewardExtState, IContributionRewardExtProposalState, ContributionRewardExtProposal, Address } from "@daostack/arc.js";
import Loading from "components/Shared/Loading";
import { getCrxRewarderComponent, CrxRewarderComponentType, getCrxRewarderProposalClass } from "components/Plugin/ContributionRewardExtRewarders/rewardersProps";

interface IExternalProps extends RouteComponentProps<any> {
  currentAccountAddress: Address;
  daoState: IDAOState;
  proposalId: string;
}

interface IStateProps {
  crxDetailsComponent: any;
}

type IProps = IExternalProps & ISubscriptionProps<IContributionRewardExtProposalState>;

class DetailsPageRouter extends React.Component<IProps, IStateProps>
{

  constructor(props: IProps) {
    super(props);
    this.state = {
      crxDetailsComponent: null,
    };
  }

  public async componentDidMount() {
    if (!this.state.crxDetailsComponent) {
      this.setState({ crxDetailsComponent: await getCrxRewarderComponent(
        (await this.props.data.plugin.entity.fetchState()) as IContributionRewardExtState,
        CrxRewarderComponentType.Details
      ) });
    }
  }

  public render(): RenderOutput {
    if (!this.state.crxDetailsComponent) {
      return null;
    }


    const proposalState = this.props.data;

    if (this.props.daoState.id !== proposalState.dao.id) {
      return <div>The given proposal does not belong to ${this.props.daoState.name}.  Please check the browser url.</div>;
    }

    /**
     * can't supply `...this.props` here because it contains a bunch of `withSubscription` properties
     * that will completely hose the crxDetailsComponent
     */
    return <this.state.crxDetailsComponent
      match= {this.props.match}
      history= {this.props.history}
      location = {this.props.location}
      staticContext = {this.props.staticContext}
      currentAccountAddress= {this.props.currentAccountAddress}
      daoState={this.props.daoState}
      proposalState={proposalState} />;
  }
}

export default withSubscription({
  wrappedComponent: DetailsPageRouter,
  loadingComponent: <Loading/>,
  errorComponent: null,
  checkForUpdate: [],
  createObservable: async (props: IProps) => {
    const arc = getArc();
    const crxProposal = new ContributionRewardExtProposal(arc, props.proposalId);
    const crxProposalState = await crxProposal.fetchState();
    const proposalClass = getCrxRewarderProposalClass(await crxProposalState.plugin.entity.fetchState() as IContributionRewardExtState);
    const proposal = new proposalClass(arc, props.proposalId);
    return proposal.state( { subscribe: true });
  },
});
