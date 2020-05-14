import { IDAOState, IProposalStage, IProposalState, IPluginState, AnyProposal } from "@dorgtech/arc.js";
import { getArc } from "arc";
import VoteGraph from "components/Proposal/Voting/VoteGraph";
import ProposalCountdown from "components/Shared/ProposalCountdown";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { humanProposalTitle } from "lib/util";
import { pluginName } from "lib/pluginUtils";
import * as React from "react";
import { Link } from "react-router-dom";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import * as css from "./PluginCard.scss";

interface IExternalProps {
  daoState: IDAOState;
  pluginState: IPluginState;
}

type SubscriptionData = AnyProposal[];
type IProps = IExternalProps & ISubscriptionProps<SubscriptionData>;

const ProposalPluginCard = (props: IProps) => {
  const { data, daoState, pluginState } = props;

  const boostedProposals = data;

  const numProposals =  pluginState.numberOfQueuedProposals + pluginState.numberOfBoostedProposals + pluginState.numberOfPreBoostedProposals;
  const proposals = boostedProposals.slice(0, 3);

  const proposalsHTML = proposals.map((proposal: AnyProposal) => <SubscribedProposalDetail key={proposal.id} proposal={proposal} daoState={daoState} />);
  const headerHtml = <h2>{pluginName(pluginState, "[Unknown]")}</h2>;

  let trainingTooltipMessage: string;

  switch (pluginState.name) {
    case "ContributionReward":
    case "ContributionRewardExt":
      trainingTooltipMessage = "Use this plugin to reward users (rep and/or funds) for their contributions to the DAO";
      break;
    case "SchemeRegistrar":
      trainingTooltipMessage = "Use this plugin to install, remove or edit the plugins of the DAO";
      break;
  }

  return (
    <div className={css.wrapper} data-test-id={`pluginCard-${pluginState.name}`}>
      <Link className={css.headerLink} to={`/dao/${daoState.address}/plugin/${pluginState.id}`}>
        { trainingTooltipMessage ?
          <TrainingTooltip placement="topLeft" overlay={trainingTooltipMessage}>
            {headerHtml}
          </TrainingTooltip> : headerHtml
        }
        <div>
          <b>{pluginState.numberOfBoostedProposals}</b> <span>Boosted</span> <b>{pluginState.numberOfPreBoostedProposals}</b> <span>Pending Boosting</span> <b>{pluginState.numberOfQueuedProposals}</b> <span>Regular</span>
        </div>
        {proposals.length === 0 ?
          <div className={css.loading}>
            <img src="/assets/images/meditate.svg" />
            <div>
              No upcoming proposals
            </div>
          </div>
          : " "
        }
      </Link>

      {proposals.length > 0 ?
        <div>
          {proposalsHTML}
          <div className={css.numProposals}>
            <Link to={`/dao/${daoState.address}/plugin/${pluginState.id}/proposals`}>View all {numProposals} &gt;</Link>
          </div>
        </div>
        : " "
      }
    </div>
  );
};

export default withSubscription({
  wrappedComponent: ProposalPluginCard,
  loadingComponent: <Loading/>,
  errorComponent: (props) => <div>{ props.error.message }</div>,

  checkForUpdate: (oldProps: IExternalProps, newProps: IExternalProps) => {
    return oldProps.daoState.address !== newProps.daoState.address;
  },

  createObservable: (props: IExternalProps) => {
    const arc = getArc();
    const dao = arc.dao(props.daoState.address);
    return dao.proposals({ where: {
      plugin:  props.pluginState.id,
      // eslint-disable-next-line @typescript-eslint/camelcase
      stage_in: [IProposalStage.Boosted, IProposalStage.QuietEndingPeriod],
    }}, {
      fetchAllData: true,
      subscribe: true, // subscribe to updates of the proposals. We can replace this once https://github.com/daostack/subgraph/issues/326 is done
    }) // the list of boosted proposals
  },
});


// TODO: move this to a separate file
/***** ProposalDetail Component *****/
interface IProposalDetailProps extends ISubscriptionProps<IProposalState> {
  daoState: IDAOState;
  proposal: AnyProposal;
}

const ProposalDetail = (props: IProposalDetailProps) => {
  const { data, daoState, proposal } = props;

  const proposalState = data;
  return (
    <Link className={css.proposalTitle} to={"/dao/" + daoState.address + "/proposal/" + proposal.id} data-test-id="proposal-title">
      <div className={css.container}>
        <div className={css.miniGraph}>
          <VoteGraph size={20} proposalState={proposalState} />
        </div>
        <div className={css.title}>
          {humanProposalTitle(proposalState)}
        </div>
        <div className={css.countdown}>
          <ProposalCountdown proposalState={proposalState} pluginView />
        </div>
      </div>
    </Link>
  );
};

const SubscribedProposalDetail = withSubscription({
  wrappedComponent: ProposalDetail,
  loadingComponent: <div>Loading...</div>,
  errorComponent: null,
  checkForUpdate: (oldProps: IProposalDetailProps, newProps: IProposalDetailProps) => {
    return oldProps.proposal.id !== newProps.proposal.id;
  },
  createObservable: (props: IProposalDetailProps) => {
    return props.proposal.state({});
  },
});
