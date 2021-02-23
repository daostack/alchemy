import { History } from "history";
import { Address, IDAOState, IProposalStage, ISchemeState, Proposal, Vote, Reward, Scheme, Stake } from "@daostack/arc.js";
import { getArc } from "arc";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import gql from "graphql-tag";
import Analytics from "lib/analytics";
import { schemeName } from "lib/schemeUtils";
import { Page } from "pages";
import * as React from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { Link } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { Observable, combineLatest } from "rxjs";
import { connect } from "react-redux";
import { showNotification } from "@store/notifications/notifications.reducer";
import ProposalCard from "../Proposal/ProposalCard";
import * as css from "./SchemeProposals.scss";
import { standardPolling, getNetworkByDAOAddress } from "lib/util";

// For infinite scrolling
const PAGE_SIZE_QUEUED = 100;
const PAGE_SIZE_PREBOOSTED = 100;

const Fade = ({ children, ...props }: any): any => (
  <CSSTransition
    {...props}
    timeout={1000}
    classNames={{
      enter: css.fadeEnter,
      enterActive: css.fadeEnterActive,
      exit: css.fadeExit,
      exitActive: css.fadeExitActive,
    }}
  >
    {children}
  </CSSTransition>
);

interface IExternalProps {
  currentAccountAddress: Address;
  history: History;
  scheme: ISchemeState;
  daoState: IDAOState;
  crxRewarderProps: any;
}

interface IDispatchProps {
  showNotification: typeof showNotification;
}

type SubscriptionData = [Proposal[], Proposal[]];
type IProps = IExternalProps & IDispatchProps & ISubscriptionProps<SubscriptionData>;

type PreboostedProposalsSubscriptionData = Proposal[];
type IPropsPreBoosted = {
  currentAccountAddress: Address;
  scheme: ISchemeState;
  daoState: IDAOState;
} & ISubscriptionProps<Proposal[]>;

type RegularProposalsSubscriptionData = Proposal[];
type IPropsQueued = {
  currentAccountAddress: Address;
  scheme: ISchemeState;
  daoState: IDAOState;
} & ISubscriptionProps<Proposal[]>;


const mapDispatchToProps = {
  showNotification,
};

class SchemeProposalsPreboosted extends React.Component<IPropsPreBoosted, null> {

  public render(): RenderOutput {
    const proposalsPreBoosted = this.props.data;
    const { currentAccountAddress, daoState, fetchMore, scheme } = this.props;
    const preBoostedProposalsHTML = (
      <TransitionGroup className="boosted-proposals-list">
        {proposalsPreBoosted.map((proposal: Proposal): any => (
          <Fade key={"proposal_" + proposal.id}>
            <ProposalCard proposal={proposal} daoState={daoState} currentAccountAddress={currentAccountAddress} />
          </Fade>
        ))}
      </TransitionGroup>
    );

    return (
      <div className={css.regularContainer}>
        <div className={css.proposalsHeader}>
          <span>Pending Boosting Proposals ({scheme.numberOfPreBoostedProposals})</span>
          {proposalsPreBoosted.length === 0
            ?
            <div>
              <img src="/assets/images/yoga.svg" />
            </div>
            : " "
          }
        </div>
        <div className={css.proposalsContainer}>
          {
            /**
             * scrollThreshold 0% forces getting all of the preboosted proposals
             * pretty much right away (but paged)
             */
          }
          <InfiniteScroll
            style={{ overflow: "visible" }}
            dataLength={proposalsPreBoosted.length}
            next={fetchMore}
            hasMore={proposalsPreBoosted.length < scheme.numberOfPreBoostedProposals}
            loader={<h4>Fetching more preboosted proposals...</h4>}
            endMessage={""}
            scrollThreshold="0%"
          >
            {preBoostedProposalsHTML}
          </InfiniteScroll>
        </div>
      </div>
    );
  }
}

const SubscribedProposalsPreBoosted = withSubscription<IPropsPreBoosted, PreboostedProposalsSubscriptionData>({
  wrappedComponent: SchemeProposalsPreboosted,
  loadingComponent: <Loading />,
  errorComponent: null,

  checkForUpdate: (oldProps, newProps) => {
    return oldProps.scheme.id !== newProps.scheme.id;
  },

  createObservable: async (props: IPropsPreBoosted) => {
    const dao = props.daoState.dao;
    const schemeId = props.scheme.id;

    // the list of preboosted proposals
    return dao.proposals({
      where: { scheme: schemeId, stage: IProposalStage.PreBoosted },
      orderBy: "preBoostedAt",
      first: PAGE_SIZE_PREBOOSTED,
      skip: 0,
    }, standardPolling());
  },

  getFetchMoreObservable: (props: IPropsPreBoosted, data: PreboostedProposalsSubscriptionData) => {
    const dao = props.daoState.dao;

    return dao.proposals({
      where: { scheme: props.scheme.id, stage: IProposalStage.PreBoosted },
      orderBy: "preBoostedAt",
      first: PAGE_SIZE_PREBOOSTED,
      skip: data.length,
    }, standardPolling());
  },
});

class SchemeProposalsQueued extends React.Component<IPropsQueued, null> {

  public render(): RenderOutput {
    const proposalsQueued = this.props.data;
    const { currentAccountAddress, daoState, fetchMore, scheme } = this.props;
    const queuedProposalsHTML = (
      <TransitionGroup className="queued-proposals-list">
        {proposalsQueued.map((proposal: Proposal): any => (
          <Fade key={"proposal_" + proposal.id}>
            <ProposalCard proposal={proposal} daoState={daoState} currentAccountAddress={currentAccountAddress} />
          </Fade>
        ))}
      </TransitionGroup>
    );

    return (
      <div className={css.regularContainer}>
        <div className={css.proposalsHeader}>
          <span>Regular Proposals ({scheme.numberOfQueuedProposals})</span>
          {proposalsQueued.length === 0
            ?
            <div>
              <img src="/assets/images/yoga.svg" />
            </div>
            : " "
          }
        </div>
        <div className={css.proposalsContainer}>
          <InfiniteScroll
            style={{ overflow: "visible" }}
            dataLength={proposalsQueued.length} //This is important field to render the next data
            next={fetchMore}
            hasMore={proposalsQueued.length < scheme.numberOfQueuedProposals}
            loader={<h4>Fetching more queued proposals...</h4>}
            endMessage={""}
          >
            {queuedProposalsHTML}
          </InfiniteScroll>
        </div>
      </div>
    );
  }
}

const SubscribedProposalsQueued = withSubscription<IPropsQueued, RegularProposalsSubscriptionData>({
  wrappedComponent: SchemeProposalsQueued,
  loadingComponent: <Loading />,
  errorComponent: null,

  checkForUpdate: (oldProps, newProps) => {
    return oldProps.scheme.id !== newProps.scheme.id;
  },

  createObservable: async (props: IPropsQueued) => {
    const dao = props.daoState.dao;
    const schemeId = props.scheme.id;

    // the list of queued proposals
    return dao.proposals({
      // eslint-disable-next-line @typescript-eslint/camelcase
      where: { scheme: schemeId, stage: IProposalStage.Queued },
      orderBy: "confidence",
      orderDirection: "desc",
      first: PAGE_SIZE_QUEUED,
      skip: 0,
    }, standardPolling());
  },

  getFetchMoreObservable: (props: IPropsQueued, data: RegularProposalsSubscriptionData) => {
    const dao = props.daoState.dao;

    return dao.proposals({
      // eslint-disable-next-line @typescript-eslint/camelcase
      where: { scheme: props.scheme.id, stage: IProposalStage.Queued },
      orderBy: "confidence",
      orderDirection: "desc",
      first: PAGE_SIZE_QUEUED,
      skip: data.length,
    }, standardPolling());
  },
});

class SchemeProposalsPage extends React.Component<IProps, null> {

  public componentDidMount() {
    Analytics.track("Page View", {
      "Page Name": Page.SchemeProposals,
      "DAO Address": this.props.daoState.address,
      "DAO Name": this.props.daoState.name,
      "Scheme Address": this.props.scheme.address,
      "Scheme Name": this.props.scheme.name,
    });
  }

  public render(): RenderOutput {
    const { data } = this.props;
    const [proposalsBoosted, allProposals] = data;
    const { currentAccountAddress, daoState, scheme } = this.props;
    const boostedProposalsHTML = (
      <TransitionGroup className="boosted-proposals-list">
        { proposalsBoosted.map((proposal: Proposal): any => (
          <Fade key={"proposal_" + proposal.id}>
            <ProposalCard proposal={proposal} daoState={daoState} currentAccountAddress={currentAccountAddress} />
          </Fade>
        ))}
      </TransitionGroup>
    );

    const schemeFriendlyName = schemeName(scheme, scheme.address);

    return (
      <>
        {(allProposals.length === 0)
          ?
          <div className={css.noDecisions}>
            <img className={css.relax} src="/assets/images/yogaman.svg" />
            <div className={css.proposalsHeader}>
              No upcoming proposals
            </div>
            <p>You can be the first one to create a {schemeFriendlyName} proposal today! :)</p>
            <div className={css.cta}>
              <Link to={"/dao/" + daoState.address}>
                <img className={css.relax} src="/assets/images/lt.svg" /> Back to plugins
              </Link>
            </div>
          </div>
          :
          <div>
            <div className={css.boostedContainer}>
              <div className={css.proposalsHeader}>
                <span>Boosted Proposals ({scheme.numberOfBoostedProposals})</span>
                {proposalsBoosted.length === 0
                  ?
                  <div>
                    <img src="/assets/images/yoga.svg" />
                  </div>
                  : " "
                }
              </div>
              <div className={css.proposalsContainer + " " + css.boostedProposalsContainer}>
                {boostedProposalsHTML}
              </div>
            </div>

            <SubscribedProposalsPreBoosted currentAccountAddress={currentAccountAddress} daoState={daoState} scheme={scheme}></SubscribedProposalsPreBoosted>

            <SubscribedProposalsQueued currentAccountAddress={currentAccountAddress} daoState={daoState} scheme={scheme}></SubscribedProposalsQueued>

          </div>
        }
      </>
    );
  }
}

// For some reason there is a weird maybe bug in TypeScript where adding the functions for fetchingMOre
//   is causing it to misinterpret the type of the SubscriptionData, so have to manually specificy here
const SubscribedSchemeProposalsPage = withSubscription<IProps, SubscriptionData>({
  wrappedComponent: SchemeProposalsPage,
  loadingComponent: <Loading />,
  errorComponent: null,

  checkForUpdate: (oldProps, newProps) => {
    return oldProps.scheme.id !== newProps.scheme.id;
  },

  createObservable: async (props: IExternalProps) => {
    const arc = getArc(getNetworkByDAOAddress(props.daoState.id));
    const dao = props.daoState.dao;
    const schemeId = props.scheme.id;

    // this query will fetch al data we need before rendering the page, so we avoid hitting the server
    let bigProposalQuery;
    if (props.currentAccountAddress) {
      bigProposalQuery = gql`
        query ProposalDataForSchemeProposalsPage {
          proposals (where: {
            scheme: "${schemeId}"
            stage_in: [
              "${IProposalStage[IProposalStage.Boosted]}",
              "${IProposalStage[IProposalStage.PreBoosted]}",
              "${IProposalStage[IProposalStage.Queued]}"
              "${IProposalStage[IProposalStage.QuietEndingPeriod]}",
            ]
          }){
            ...ProposalFields
            votes (where: { voter: "${props.currentAccountAddress}"}) {
              ...VoteFields
            }
            stakes (where: { staker: "${props.currentAccountAddress}"}) {
              ...StakeFields
            }
            gpRewards (where: { beneficiary: "${props.currentAccountAddress}"}) {
              ...RewardFields
            }
          }
        }
        ${Proposal.fragments.ProposalFields}
        ${Vote.fragments.VoteFields}
        ${Stake.fragments.StakeFields}
        ${Reward.fragments.RewardFields}
        ${Scheme.fragments.SchemeFields}
      `;
    } else {
      bigProposalQuery = gql`
        query ProposalDataForSchemeProposalsPage {
          proposals (where: {
            scheme: "${schemeId}"
            stage_in: [
              "${IProposalStage[IProposalStage.Boosted]}",
              "${IProposalStage[IProposalStage.PreBoosted]}",
              "${IProposalStage[IProposalStage.Queued]}"
              "${IProposalStage[IProposalStage.QuietEndingPeriod]}",
            ]
          }){
            ...ProposalFields
          }
        }
        ${Proposal.fragments.ProposalFields}
        ${Scheme.fragments.SchemeFields}
      `;
    }

    return combineLatest(
      // the list of boosted proposals
      dao.proposals({
        // eslint-disable-next-line @typescript-eslint/camelcase
        where: { scheme: schemeId, stage_in: [IProposalStage.Boosted, IProposalStage.QuietEndingPeriod] },
        orderBy: "boostedAt",
      }, standardPolling()),
      // big subscription query to make all other subscription queries obsolete
      arc.getObservable(bigProposalQuery, standardPolling()) as Observable<Proposal[]>,
    );
  },
});

export default connect(null, mapDispatchToProps)(SubscribedSchemeProposalsPage);
