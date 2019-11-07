import { IDAOState, IProposalStage, IProposalState, ISchemeState, Proposal, Scheme } from "@daostack/client";
import { getArc } from "arc";
import VoteGraph from "components/Proposal/Voting/VoteGraph";
import Countdown from "components/Shared/Countdown";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { humanProposalTitle, schemeName } from "lib/util";
import * as React from "react";
import { Link } from "react-router-dom";
import { closingTime } from "reducers/arcReducer";
import { combineLatest } from "rxjs";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import * as css from "./SchemeCard.scss";

interface IExternalProps {
  dao: IDAOState;
  scheme: Scheme;
}

type SubscriptionData = [ISchemeState, Proposal[]];
type IProps = IExternalProps & ISubscriptionProps<SubscriptionData>;

const ProposalSchemeCard = (props: IProps) => {
  const { data, dao} = props;

  const [schemeState, boostedProposals] = data;

  const numProposals =  schemeState.numberOfQueuedProposals + schemeState.numberOfBoostedProposals + schemeState.numberOfQueuedProposals;
  const proposals = boostedProposals.slice(0, 3);

  const proposalsHTML = proposals.map((proposal: Proposal) => <SubscribedProposalDetail key={proposal.id} proposal={proposal} dao={dao} />);

  let trainingTooltipMessage: string;
  
  switch(schemeState.name) {
    case "ContributionReward":
      trainingTooltipMessage = "Use this scheme to reward users (rep and/or funds) for their contributions to the DAO";
      break;
    case "SchemeRegistrar":
      trainingTooltipMessage = "Use this scheme to install, remove or edit the schemes of the DAO";
      break;
  }

  return (
    <div className={css.wrapper} data-test-id={`schemeCard-${schemeState.name}`}>
      <Link className={css.headerLink} to={`/dao/${dao.address}/scheme/${schemeState.id}`}>
        <TrainingTooltip placement="topLeft"
          overlay={trainingTooltipMessage}
          trigger={trainingTooltipMessage ? undefined : []}
        >
          <h2>{schemeName(schemeState, "[Unknown]")}</h2>
        </TrainingTooltip>
        <div>
          <b>{schemeState.numberOfBoostedProposals}</b> <span>Boosted</span> <b>{schemeState.numberOfPreBoostedProposals}</b> <span>Pending</span> <b>{schemeState.numberOfQueuedProposals}</b> <span>Regular</span>
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
            <Link to={`/dao/${dao.address}/scheme/${schemeState.id}/proposals`}>View all {numProposals} &gt;</Link>
          </div>
        </div>
        : " "
      }
    </div>
  );
};

export default withSubscription({
  wrappedComponent: ProposalSchemeCard,
  loadingComponent: <div><Loading/></div>,
  errorComponent: (props) => <div>{ props.error.message }</div>,

  checkForUpdate: (oldProps: IExternalProps, newProps: IExternalProps) => {
    return oldProps.dao.address !== newProps.dao.address;
  },

  createObservable: (props: IExternalProps) => {
    const arc = getArc();
    const dao = arc.dao(props.dao.address);
    return combineLatest(
      props.scheme.state(),
      dao.proposals({ where: {
        scheme:  props.scheme.id,
        // eslint-disable-next-line @typescript-eslint/camelcase
        stage_in: [IProposalStage.Boosted, IProposalStage.QuietEndingPeriod],
      }}, {
        fetchAllData: true,
        subscribe: true, // subscribe to updates of the proposals. We can replace this once https://github.com/daostack/subgraph/issues/326 is done
      }) // the list of boosted proposals
    );
  },
});


/***** ProposalDetail Component *****/
interface IProposalDetailProps extends ISubscriptionProps<IProposalState> {
  dao: IDAOState;
  proposal: Proposal;
}
const ProposalDetail = (props: IProposalDetailProps) => {
  const { data, dao, proposal } = props;

  const proposalState = data;
  return (
    <Link className={css.proposalTitle} to={"/dao/" + dao.address + "/proposal/" + proposal.id} data-test-id="proposal-title">
      <span>
        <em className={css.miniGraph}>
          <VoteGraph size={20} proposal={proposalState} />
        </em>
        {humanProposalTitle(proposalState)}
      </span>
      <b>
        <Countdown toDate={closingTime(proposalState)} detailView={false} schemeView />
      </b>
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
    return props.proposal.state();
  },
});
