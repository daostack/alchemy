import { RouteComponentProps } from "react-router";
import * as React from "react";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { getArc } from "arc";
import { IDAOState, IProposalState } from "@daostack/client";
import Loading from "components/Shared/Loading";
import { getCrxRewarderConfig } from "crxRegistry";
import {default as CompetitionDetails} from "components/Scheme/ContributionRewardExtRewarders/Competition/Details";
import * as css from "../Scheme.scss";

interface IExternalProps extends RouteComponentProps<any> {
  daoState: IDAOState;
  proposalId: string;
}

type IProps = IExternalProps & ISubscriptionProps<IProposalState>;


class DetailsPageRouter extends React.Component<IProps, null>
{

  public render(): RenderOutput {
    const proposalState = this.props.data;
    const schemeState = proposalState.scheme;

    const crxRewarderConfig = getCrxRewarderConfig(schemeState);
    
    if (!crxRewarderConfig) {
      return null;
    }

    /**
     * display the details page as supplied by the given Crx rewarder
     */
    switch(crxRewarderConfig.contractName) {
      case "Competition":
        return <CompetitionDetails 
          daoState={this.props.daoState}
          proposalState={proposalState} />;
      default:
        throw new Error(`Unknown ContributionRewardExt rewarder name: ${crxRewarderConfig.contractName}`);
    }
  }
}

export default withSubscription({
  wrappedComponent: DetailsPageRouter,
  loadingComponent: <div className={css.loading}><Loading/></div>,
  errorComponent: null,
  checkForUpdate: [],
  createObservable: (props: IProps) => {
    const arc = getArc(); // TODO: maybe we pass in the arc context from withSubscription instead of creating one every time?
    return arc.proposal(props.proposalId).state( { subscribe: true });
  },
});
