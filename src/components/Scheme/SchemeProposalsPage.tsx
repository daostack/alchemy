import * as H from "history";
import { Address, IDAOState, IProposalStage, ISchemeState, Proposal, Vote, Reward, Stake } from "@daostack/client";
import { enableWalletProvider, getArc } from "arc";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import gql from "graphql-tag";
import { schemeName} from "lib/util";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import * as InfiniteScroll from "react-infinite-scroll-component";
import { Link, RouteComponentProps } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { Observable, combineLatest } from "rxjs";
import { connect } from "react-redux";
import { showNotification } from "reducers/notifications";
import classNames from "classnames";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import ProposalCard from "../Proposal/ProposalCard";
import * as css from "./SchemeProposals.scss";

// For infinite scrolling
const PAGE_SIZE = 100;

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

interface IExternalProps extends RouteComponentProps<any> {
  currentAccountAddress: Address;
  history: H.History;
  isActive: boolean;
  scheme: ISchemeState;
}

interface IDispatchProps {
  showNotification: typeof showNotification;
}

type SubscriptionData = [Proposal[], Proposal[], Proposal[], IDAOState, Proposal[]];
type IProps = IExternalProps & IDispatchProps & ISubscriptionProps<SubscriptionData>;

const mapDispatchToProps = {
  showNotification,
};

class SchemeProposalsPage extends React.Component<IProps, null> {

  private async handleNewProposal(daoAvatarAddress: Address, schemeId: any): Promise<void> {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    this.props.history.push(`/dao/${daoAvatarAddress}/scheme/${schemeId}/proposals/create/`);
  }

  private _handleNewProposal = (e: any): void => {
    this.handleNewProposal(this.props.data[3].address, this.props.scheme.id);
    e.preventDefault();
  };

  public render(): RenderOutput {
    const { data } = this.props;

    const [proposalsQueued, proposalsPreBoosted, proposalsBoosted, dao] = data;
    const { currentAccountAddress, fetchMore, isActive, scheme } = this.props;

    const queuedProposalsHTML = (
      <TransitionGroup className="queued-proposals-list">
        { proposalsQueued.map((proposal: Proposal): any => (
          <Fade key={"proposal_" + proposal.id}>
            <ProposalCard proposal={proposal} daoState={dao} currentAccountAddress={currentAccountAddress} />
          </Fade>
        ))}
      </TransitionGroup>
    );

    const preBoostedProposalsHTML = (
      <TransitionGroup className="boosted-proposals-list">
        { proposalsPreBoosted.map((proposal: Proposal): any => (
          <Fade key={"proposal_" + proposal.id}>
            <ProposalCard proposal={proposal} daoState={dao} currentAccountAddress={currentAccountAddress} />
          </Fade>
        ))}
      </TransitionGroup>
    );

    const boostedProposalsHTML = (
      <TransitionGroup className="boosted-proposals-list">
        { proposalsBoosted.map((proposal: Proposal): any => (
          <Fade key={"proposal_" + proposal.id}>
            <ProposalCard proposal={proposal} daoState={dao} currentAccountAddress={currentAccountAddress} />
          </Fade>
        ))}
      </TransitionGroup>
    );

    return (
      <div>
        <BreadcrumbsItem to={`/dao/${dao.address}/scheme/${scheme.id}`}>{schemeName(scheme, scheme.address)}</BreadcrumbsItem>

        { proposalsQueued.length === 0 && proposalsPreBoosted.length === 0 && proposalsBoosted.length === 0
          ?
          <div className={css.noDecisions}>
            <img className={css.relax} src="/assets/images/yogaman.svg"/>
            <div className={css.proposalsHeader}>
              No upcoming proposals
            </div>
            <p>You can be the first one to create a {scheme.name && scheme.name.replace(/([A-Z])/g, " $1") || scheme.address} proposal today! (:</p>
            <div className={css.cta}>
              <Link to={"/dao/" + dao.address}>
                <img className={css.relax} src="/assets/images/lt.svg"/> Back to schemes
              </Link>
              <a className={classNames({
                [css.blueButton]: true,
                [css.disabled]: !isActive,
              })}
              href="javascript:void(0)"
              onClick={isActive ? this._handleNewProposal : null}
              data-test-id="createProposal"
              >+ New Proposal</a>
            </div>
          </div>
          :
          <div>
            <div className={css.boostedContainer}>
              <TrainingTooltip placement="bottom" overlay={"Boosted proposals are passed or failed via relative majority over a configured voting period"}>
                <div className={css.proposalsHeader}>
                Boosted Proposals ({scheme.numberOfBoostedProposals})
                  {proposalsBoosted.length === 0
                    ?
                    <div>
                      <img src="/assets/images/yoga.svg"/>
                    </div>
                    : " "
                  }
                </div>
              </TrainingTooltip>
              <div className={css.proposalsContainer + " " + css.boostedProposalsContainer}>
                {boostedProposalsHTML}
              </div>
            </div>

            <div className={css.regularContainer}>
              <TrainingTooltip placement="bottom" overlay={"Pending proposals have reached the prediction score required for boosting and now must make it through the pending period without dipping below that threshold in order to be boosted."}>
                <div className={css.proposalsHeader}>
                Pending Proposals ({scheme.numberOfPreBoostedProposals})
                  {proposalsPreBoosted.length === 0
                    ?
                    <div>
                      <img src="/assets/images/yoga.svg"/>
                    </div>
                    : " "
                  }
                </div>
              </TrainingTooltip>
              <div className={css.proposalsContainer}>
                {preBoostedProposalsHTML}
              </div>
            </div>
            <div className={css.regularContainer}>
              <TrainingTooltip placement="bottom" overlay={"Regular proposals are passed or failed via absolute majority over a configured voting period. If enough GEN is staked predicting they will pass, they can move to the pending and then boosted queues."}>
                <div className={css.proposalsHeader}>
                Regular Proposals ({scheme.numberOfQueuedProposals})
                  {proposalsQueued.length === 0
                    ?
                    <div>
                      <img src="/assets/images/yoga.svg"/>
                    </div>
                    : " "
                  }
                </div>
              </TrainingTooltip>
              <div className={css.proposalsContainer}>
                <InfiniteScroll
                  dataLength={proposalsQueued.length} //This is important field to render the next data
                  next={fetchMore}
                  hasMore={proposalsQueued.length < scheme.numberOfQueuedProposals}
                  loader={<h4>Fetching more proposals...</h4>}
                  endMessage={
                    <p style={{textAlign: "center"}}>
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

// For some reason there is a weird maybe bug in TypeScript where adding the functions for fetchingMOre
//   is causing it to misinterpret the type of the SubscriptionData, so have to manually specificy here
const SubscribedSchemeProposalsPage = withSubscription<IProps, SubscriptionData>({
  wrappedComponent: SchemeProposalsPage,
  loadingComponent: <div className={css.loading}><Loading/></div>,
  errorComponent: null,

  checkForUpdate: (oldProps, newProps) => {
    return oldProps.match.params.daoAvatarAddress !== oldProps.match.params.daoAvatarAddress
           || oldProps.scheme.id !== newProps.scheme.id;
  },

  createObservable: async (props: IExternalProps) => {
    const daoAvatarAddress = props.match.params.daoAvatarAddress;
    const arc = getArc();
    const dao = arc.dao(daoAvatarAddress);
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
      `;
    }

    return combineLatest(
      // the list of queued proposals
      dao.proposals({
        // eslint-disable-next-line @typescript-eslint/camelcase
        where: { scheme: schemeId, stage: IProposalStage.Queued },
        orderBy: "confidence",
        orderDirection: "desc",
        first: PAGE_SIZE,
        skip: 0,
      }, { subscribe: true }),

      // the list of preboosted proposals
      dao.proposals({
        where: { scheme: schemeId, stage: IProposalStage.PreBoosted },
        orderBy: "preBoostedAt",
      }, { subscribe: true }),

      // the list of boosted proposals
      dao.proposals({
        // eslint-disable-next-line @typescript-eslint/camelcase
        where: { scheme: schemeId, stage_in: [IProposalStage.Boosted, IProposalStage.QuietEndingPeriod] },
        orderBy: "boostedAt",
      }, { subscribe: true}),

      // DAO state
      dao.state(),
      // big subscription query to make all other subscription queries obsolete
      arc.getObservable(bigProposalQuery, {subscribe: true}) as Observable<Proposal[]>,
    );
  },

  getFetchMoreObservable: (props: IExternalProps, data: SubscriptionData) => {
    const daoAvatarAddress = props.match.params.daoAvatarAddress;
    const arc = getArc();
    const dao = arc.dao(daoAvatarAddress);

    return dao.proposals({
      // eslint-disable-next-line @typescript-eslint/camelcase
      where: { scheme: props.scheme.id, stage: IProposalStage.Queued },
      orderBy: "confidence",
      orderDirection: "desc",
      first: PAGE_SIZE,
      skip: data[0].length,
    }, { subscribe: true, fetchAllData: true });
  },

  fetchMoreCombine: (prevState: SubscriptionData, newData: Proposal[]) => {
    return [prevState[0].concat(newData), prevState[1], prevState[2], prevState[3], []];
  },
});

export default connect(null, mapDispatchToProps)(SubscribedSchemeProposalsPage);
