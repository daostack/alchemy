import { RouteComponentProps } from "react-router";
import * as React from "react";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { getArc } from "arc";
import { IDAOState, IProposalState, Address } from "@daostack/client";
import Loading from "components/Shared/Loading";
import * as css from "../Scheme.scss";

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
    const newState = {};

    if (!this.state.crxDetailsComponent) {
      // FAKE -- until this is fixed:  https://github.com/daostack/client/issues/340
      Object.assign(newState, { crxDetailsComponent : (await import("components/Scheme/ContributionRewardExtRewarders/Competition/Details")).default });
      // Object.apply(newState, { crxDetailsComponent: await getCrxRewarderComponent(this.props.data[0], CrxRewarderComponentType.Details) });
    }

    this.setState(newState);
  }

  public render(): RenderOutput {
    const proposalState = this.props.data;

    if (!this.state.crxDetailsComponent) {
      return null;
    }

    return <this.state.crxDetailsComponent
      currentAccountAddress= {this.props.currentAccountAddress}
      daoState={this.props.daoState}
      proposalState={proposalState} />;
  }
}

export default withSubscription({
  wrappedComponent: DetailsPageRouter,
  loadingComponent: <div className={css.loading}><Loading/></div>,
  errorComponent: null,
  checkForUpdate: [],
  createObservable: (props: IProps) => {
    const arc = getArc();
    return arc.proposal(props.proposalId).state( { subscribe: true });
  },
});
