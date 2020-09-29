import { IDAOState, IProposalStage, IProposalState, ISchemeState, Proposal, Scheme } from "@daostack/arc.js";
import { getArc } from "arc";
import VoteGraph from "components/Proposal/Voting/VoteGraph";
import ProposalCountdown from "components/Shared/ProposalCountdown";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { humanProposalTitle, standardPolling } from "lib/util";
import { schemeName } from "lib/schemeUtils";
import * as React from "react";
import { Link } from "react-router-dom";
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
  const { data, dao } = props;

  const [schemeState, boostedProposals] = data;

  const numProposals = schemeState.numberOfPreBoostedProposals + schemeState.numberOfBoostedProposals + schemeState.numberOfQueuedProposals;
  const proposals = boostedProposals.slice(0, 3);

  const proposalsHTML = proposals.map((proposal: Proposal) => <SubscribedProposalDetail key={proposal.id} proposal={proposal} dao={dao} />);
  const headerHtml = <h2>{schemeName(schemeState, "[Unknown]")}</h2>;

  let trainingTooltipMessage: string;

  switch (schemeState.name) {
    case "ContributionReward":
    case "ContributionRewardExt":
      trainingTooltipMessage = "Use this scheme to reward users (rep and/or funds) for their contributions to the DAO";
      break;
    case "SchemeRegistrar":
      trainingTooltipMessage = "Use this scheme to install, remove or edit the schemes of the DAO";
      break;
  }

  return (
    <div className={css.wrapper} data-test-id={`schemeCard-${schemeState.name}`}>
      <Link className={css.headerLink} to={`/dao/${dao.address}/scheme/${schemeState.id}`}>
        { trainingTooltipMessage ?
          <TrainingTooltip placement="topLeft" overlay={trainingTooltipMessage}>
            {headerHtml}
          </TrainingTooltip> : headerHtml
        }
        <div>
          <b>{schemeState.numberOfBoostedProposals}</b> <span>Boosted</span> <b>{schemeState.numberOfPreBoostedProposals}</b> <span>Pending Boosting</span> <b>{schemeState.numberOfQueuedProposals}</b> <span>Regular</span>
        </div>
        {numProposals === 0 ?
          <div className={css.loading}>
            <img src="/assets/images/meditate.svg" />
            <div>
              No upcoming proposals
            </div>
          </div>
          : " "
        }
      </Link>

      {numProposals > 0 ?
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
  loadingComponent: <Loading/>,
  errorComponent: (props) => <div>{ props.error.message }</div>,

  checkForUpdate: (oldProps: IExternalProps, newProps: IExternalProps) => {
    return oldProps.dao.address !== newProps.dao.address;
  },

  createObservable: (props: IExternalProps) => {
    const arc = getArc();
    const dao = arc.dao(props.dao.address);
    return combineLatest(
      props.scheme.state(standardPolling()),
      dao.proposals({ where: {
        scheme:  props.scheme.id,
        // eslint-disable-next-line @typescript-eslint/camelcase
        stage_in: [IProposalStage.Boosted, IProposalStage.QuietEndingPeriod],
      },
      orderBy: "boostedAt",
      }, { fetchAllData: true }) // the list of boosted proposals
    );
  },
});


// TODO: move this to a separate file
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
      <div className={css.container}>
        <div className={css.miniGraph}>
          <VoteGraph size={20} proposal={proposalState} />
        </div>
        <div className={css.title}>
          {humanProposalTitle(proposalState)}
        </div>
        <div className={css.countdown}>
          <ProposalCountdown proposal={proposalState} schemeView />
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
    return props.proposal.state();
  },
});
