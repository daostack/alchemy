import { RouteComponentProps } from "react-router";
import * as React from "react";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { getArc } from "arc";
import { IDAOState, IProposalState, Address } from "@daostack/arc.js";
import Loading from "components/Shared/Loading";
import { getCrxRewarderComponent, CrxRewarderComponentType } from "components/Scheme/ContributionRewardExtRewarders/rewardersProps";
import { standardPolling, getNetworkByAddress } from "lib/util";

interface IExternalProps extends RouteComponentProps<any> {
  currentAccountAddress: Address;
  daoState: IDAOState;
  proposalId: string;
}

interface IStateProps {
  crxDetailsComponent: any;
}

type IProps = IExternalProps & ISubscriptionProps<IProposalState>;

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
      this.setState({ crxDetailsComponent: await getCrxRewarderComponent(this.props.data.scheme, CrxRewarderComponentType.Details) });
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
      match={this.props.match}
      history={this.props.history}
      location={this.props.location}
      staticContext={this.props.staticContext}
      currentAccountAddress={this.props.currentAccountAddress}
      daoState={this.props.daoState}
      proposalState={proposalState} />;
  }
}

export default withSubscription({
  wrappedComponent: DetailsPageRouter,
  loadingComponent: <Loading />,
  errorComponent: null,
  checkForUpdate: [],
  createObservable: (props: IProps) => {
    const arc = getArc(getNetworkByAddress(props.daoState.id));
    return arc.proposal(props.proposalId).state(standardPolling());
  },
});
