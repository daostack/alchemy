/* tslint:disable:max-classes-per-file */

import { Address, IDAOState, IProposalStage, ISchemeState, Proposal } from "@daostack/client";
import { getArc } from "arc";
import Loading from "components/Shared/Loading";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import { schemeName} from "lib/util";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import * as InfiniteScroll from "react-infinite-scroll-component";
import { Link, RouteComponentProps } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { combineLatest } from "rxjs";
import ProposalCardContainer from "../Proposal/ProposalCardContainer";
import * as css from "./SchemeProposals.scss";

// For infinite scrolling
const PAGE_SIZE = 100;

const Fade = ({ children, ...props }: any) => (
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

interface IProps {
  currentAccountAddress: Address;
  dao: IDAOState;
  fetchMore: () => void;
  hasMoreProposalsToLoad: boolean;
  proposalsBoosted: Proposal[];
  proposalsPreBoosted: Proposal[];
  proposalsQueued: Proposal[];
  scheme: ISchemeState;
}

class SchemeProposals extends React.Component<IProps, IState> {

  public render() {
    const { currentAccountAddress, dao, fetchMore, hasMoreProposalsToLoad, proposalsQueued, proposalsBoosted, proposalsPreBoosted, scheme } = this.props;

    const queuedProposalsHTML = (
      <TransitionGroup className="queued-proposals-list">
        { proposalsQueued.map((proposal: Proposal) => (
          <Fade key={"proposal_" + proposal.id}>
            <ProposalCardContainer proposal={proposal} dao={dao} currentAccountAddress={currentAccountAddress} />
          </Fade>
        ))}
      </TransitionGroup>
    );

    const preBoostedProposalsHTML = (
      <TransitionGroup className="boosted-proposals-list">
        { proposalsPreBoosted.map((proposal: Proposal) => (
          <Fade key={"proposal_" + proposal.id}>
            <ProposalCardContainer proposal={proposal} dao={dao} currentAccountAddress={currentAccountAddress} />
          </Fade>
        ))}
      </TransitionGroup>
    );

    const boostedProposalsHTML = (
      <TransitionGroup className="boosted-proposals-list">
        { proposalsBoosted.map((proposal: Proposal) => (
          <Fade key={"proposal_" + proposal.id}>
            <ProposalCardContainer proposal={proposal} dao={dao} currentAccountAddress={currentAccountAddress} />
          </Fade>
        ))}
      </TransitionGroup>
    );

    return (
      <div>
        <BreadcrumbsItem to={`/dao/${dao.address}/scheme/${scheme.id}`}>{schemeName(scheme, scheme.address)}</BreadcrumbsItem>

        { proposalsQueued.length === 0 && proposalsPreBoosted.length === 0 && proposalsBoosted.length === 0
          ? <div className={css.noDecisions}>
              <img className={css.relax} src="/assets/images/yogaman.svg"/>
              <div className={css.proposalsHeader}>
                No upcoming proposals
              </div>
              <p>You can be the first one to create a {scheme.name && scheme.name.replace(/([A-Z])/g, " $1") || scheme.address} proposal today! (:</p>
              <div className={css.cta}>
                <Link to={"/dao/" + dao.address}>
                  <img className={css.relax} src="/assets/images/lt.svg"/> Back to schemes
                </Link>
                <Link to={`/dao/${dao.address}/scheme/${scheme.id}/proposals/create/`} data-test-id="createProposal" className={css.blueButton}>+ New Proposal</Link>
              </div>
            </div>
          :
          <div>
            <div className={css.boostedContainer}>
              <div className={css.proposalsHeader}>
                Boosted Proposals ({proposalsBoosted.length})
                {proposalsBoosted.length === 0
                  ?
                    <div>
                      <img src="/assets/images/yoga.svg"/>
                    </div>
                  : " "
                }
              </div>
              <div className={css.proposalsContainer + " " + css.boostedProposalsContainer}>
                {boostedProposalsHTML}
              </div>
            </div>

            <div className={css.regularContainer}>
              <div className={css.proposalsHeader}>
                Pending Proposals ({proposalsPreBoosted.length})
                {proposalsPreBoosted.length === 0
                  ?
                    <div>
                      <img src="/assets/images/yoga.svg"/>
                    </div>
                  : " "
                }
              </div>
              <div className={css.proposalsContainer}>
                {preBoostedProposalsHTML}
              </div>
            </div>
            <div className={css.regularContainer}>
              <div className={css.proposalsHeader}>
                Regular Proposals ({proposalsQueued.length}{hasMoreProposalsToLoad ? "+" : ""})
                {proposalsQueued.length === 0
                  ?
                    <div>
                      <img src="/assets/images/yoga.svg"/>
                    </div>
                  : " "
                }
              </div>
              <div className={css.proposalsContainer}>
                <InfiniteScroll
                  dataLength={proposalsQueued.length} //This is important field to render the next data
                  next={fetchMore}
                  hasMore={hasMoreProposalsToLoad}
                  loader={<h4>Fetching more proposals...</h4>}
                  endMessage={
                    <p style={{textAlign: "center"}}>
                      <b>&mdash;</b>
                    </p>
                  }
                >
                  {queuedProposalsHTML}
                </InfiniteScroll>
              </div>
            </div>
          </div>
        }
      </div>
    );
  }
}

interface IExternalProps {
  currentAccountAddress: Address;
  scheme: ISchemeState;
}

interface IState {
  hasMoreProposalsToLoad: boolean;
}

export default class SchemeProposalsSubscription extends React.Component<IExternalProps & RouteComponentProps<any>, IState> {

  constructor(props: IExternalProps & RouteComponentProps<any>) {
    super(props);

    this.state = {
      hasMoreProposalsToLoad: true
    };
  }

  public render() {
    const daoAvatarAddress = this.props.match.params.daoAvatarAddress;
    const arc = getArc();
    const dao = arc.dao(daoAvatarAddress);
    const schemeId = this.props.scheme.id;

    // Have to fix this so that scrolling doesnt load weird different sets of proposals as the time changes
    const currentTime = Math.floor(new Date().getTime() / 1000);

    const observable = combineLatest(

      // the list of queued proposals
      dao.proposals({
        where: { scheme: schemeId, stage: IProposalStage.Queued, expiresInQueueAt_gt: currentTime },
        orderBy: "confidence",
        orderDirection: "desc",
        first: PAGE_SIZE,
        skip: 0
      }),

      // the list of preboosted proposals
      dao.proposals({
        where: { scheme: schemeId, stage: IProposalStage.PreBoosted },
        orderBy: "preBoostedAt"
      }), // the list of preboosted proposals
      arc.dao(daoAvatarAddress).proposals({
        where: { scheme: schemeId, stage_in: [IProposalStage.Boosted, IProposalStage.QuietEndingPeriod] },
        orderBy: "boostedAt"
      }), // the list of boosted proposals

      // DAO state
      dao.state()
    );

    const setState = this.setState.bind(this);
    const parentState = this.state;

    return <Subscribe observable={observable}>{
      (state: IObservableState<[Proposal[], Proposal[], Proposal[], IDAOState]>): any => {
        if (state.isLoading) {
          return  <div className={css.loading}><Loading/></div>;
        } else if (state.error) {
          throw state.error;
        } else {
          const data = state.data;
          let hasMoreProposals = parentState.hasMoreProposalsToLoad;
          if (data.length < PAGE_SIZE) {
            hasMoreProposals = false;
          }
          return <SchemeProposals
            {...this.props}
            hasMoreProposalsToLoad={hasMoreProposals}
            scheme={this.props.scheme}
            proposalsQueued={data[0]}
            proposalsPreBoosted={data[1]}
            proposalsBoosted={data[2]}
            dao={data[3]}
            fetchMore={ () => {
              state.fetchMore({
                observable: dao.proposals({
                  where: { scheme: schemeId, stage: IProposalStage.Queued, expiresInQueueAt_gt: currentTime },
                  orderBy: "confidence",
                  orderDirection: "desc",
                  first: PAGE_SIZE,
                  skip: data[1].length
                }),
                combine: (prevState: [Proposal[], Proposal[], Proposal[], IDAOState], newData: Proposal[]) => {
                  if (newData.length < PAGE_SIZE) {
                    setState({ hasMoreProposalsToLoad: false});
                  }
                  return [prevState[0].concat(newData), prevState[1], prevState[2], prevState[3]];
                }
              });
            }}
          />;
        }
      }
    }</Subscribe>;
  }
}
