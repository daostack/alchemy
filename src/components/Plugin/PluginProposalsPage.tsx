import { History } from "history";
import { Address, DAO, IDAOState, IProposalStage, IPluginState, AnyProposal, Vote, Reward, Stake, Proposal, Plugin, Proposals } from "@dorgtech/arc.js";
import { enableWalletProvider, getArc } from "arc";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import gql from "graphql-tag";
import Analytics from "lib/analytics";
import { pluginName } from "lib/pluginUtils";
import { Page } from "pages";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import * as InfiniteScroll from "react-infinite-scroll-component";
import { Link } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { Observable, combineLatest } from "rxjs";
import { connect } from "react-redux";
import { showNotification } from "reducers/notifications";
import classNames from "classnames";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import ProposalCard from "../Proposal/ProposalCard";
import * as css from "./PluginProposals.scss";

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

interface IExternalProps {
  currentAccountAddress: Address;
  history: History;
  isActive: boolean;
  pluginState: IPluginState;
  daoState: IDAOState;
  crxRewarderProps: any;
}

interface IDispatchProps {
  showNotification: typeof showNotification;
}

type SubscriptionData = [AnyProposal[], AnyProposal[], AnyProposal[], AnyProposal[]];
type IProps = IExternalProps & IDispatchProps & ISubscriptionProps<SubscriptionData>;

const mapDispatchToProps = {
  showNotification,
};

class PluginProposalsPage extends React.Component<IProps, null> {

  public componentDidMount() {
    Analytics.track("Page View", {
      "Page Name": Page.PluginProposals,
      "DAO Address": this.props.daoState.address,
      "DAO Name": this.props.daoState.name,
      "Plugin Address": this.props.pluginState.address,
      "Plugin Name": this.props.pluginState.name,
    });
  }

  private async handleNewProposal(daoAvatarAddress: Address, pluginId: any): Promise<void> {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    this.props.history.push(`/dao/${daoAvatarAddress}/plugin/${pluginId}/proposals/create/`);
  }

  private _handleNewProposal = (e: any): void => {
    this.handleNewProposal(this.props.daoState.address, this.props.pluginState.id);
    e.preventDefault();
  };

  public render(): RenderOutput {
    const { data } = this.props;

    const [proposalsQueued, proposalsPreBoosted, proposalsBoosted ] = data;
    const { currentAccountAddress, daoState, fetchMore, isActive, pluginState } = this.props;
    let proposalCount=0;

    const queuedProposalsHTML = (
      <TransitionGroup className="queued-proposals-list">
        { proposalsQueued.map((proposal: AnyProposal): any => (
          <Fade key={"proposal_" + proposal.id}>
            <ProposalCard proposal={proposal} daoState={daoState} currentAccountAddress={currentAccountAddress} suppressTrainingTooltips={proposalCount++ > 0}/>
          </Fade>
        ))}
      </TransitionGroup>
    );

    proposalCount=0;

    const preBoostedProposalsHTML = (
      <TransitionGroup className="boosted-proposals-list">
        { proposalsPreBoosted.map((proposal: AnyProposal): any => (
          <Fade key={"proposal_" + proposal.id}>
            <ProposalCard proposal={proposal} daoState={daoState} currentAccountAddress={currentAccountAddress} suppressTrainingTooltips={proposalCount++ > 0}/>
          </Fade>
        ))}
      </TransitionGroup>
    );

    proposalCount=0;

    const boostedProposalsHTML = (
      <TransitionGroup className="boosted-proposals-list">
        { proposalsBoosted.map((proposal: AnyProposal): any => (
          <Fade key={"proposal_" + proposal.id}>
            <ProposalCard proposal={proposal} daoState={daoState} currentAccountAddress={currentAccountAddress} suppressTrainingTooltips={proposalCount++ > 0}/>
          </Fade>
        ))}
      </TransitionGroup>
    );

    const pluginFriendlyName = pluginName(pluginState, pluginState.address);

    return (
      <div>
        <BreadcrumbsItem to={`/dao/${daoState.address}/plugin/${pluginState.id}`}>{pluginFriendlyName}</BreadcrumbsItem>

        <div className={css.createProposal}>
          <TrainingTooltip placement="topRight" overlay={"A small amount of ETH is necessary to submit a proposal in order to pay gas costs"}>
            <a className={
              classNames({
                [css.createProposal]: true,
                [css.disabled]: !isActive,
              })}
            data-test-id="createProposal"
            href="#!"
            onClick={isActive ? this._handleNewProposal : null}
            >
          + New { `${this.props.crxRewarderProps ? this.props.crxRewarderProps.contractName : pluginFriendlyName } `}Proposal</a>
          </TrainingTooltip>
        </div>

        { proposalsQueued.length === 0 && proposalsPreBoosted.length === 0 && proposalsBoosted.length === 0
          ?
          <div className={css.noDecisions}>
            <img className={css.relax} src="/assets/images/yogaman.svg"/>
            <div className={css.proposalsHeader}>
              No upcoming proposals
            </div>
            <p>You can be the first one to create a {pluginFriendlyName} proposal today! :)</p>
            <div className={css.cta}>
              <Link to={"/dao/" + daoState.address}>
                <img className={css.relax} src="/assets/images/lt.svg"/> Back to plugins
              </Link>
              <a className={classNames({
                [css.blueButton]: true,
                [css.disabled]: !isActive,
              })}
              href="#!"
              onClick={isActive ? this._handleNewProposal : null}
              data-test-id="createProposal"
              >+ New Proposal</a>
            </div>
          </div>
          :
          <div>
            <div className={css.boostedContainer}>
              <div className={css.proposalsHeader}>
                <TrainingTooltip placement="bottom" overlay={"Boosted proposals are passed or failed via relative majority over a configured voting period"}>
                  <span>Boosted Proposals ({pluginState.numberOfBoostedProposals})</span>
                </TrainingTooltip>
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
                <TrainingTooltip placement="bottom" overlay={"Pending boosting proposals have reached the prediction score required for boosting and now must make it through the pending period without dipping below that threshold in order to be boosted."}>
                  <span>Pending Boosting Proposals ({pluginState.numberOfPreBoostedProposals})</span>
                </TrainingTooltip>
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
                <TrainingTooltip placement="bottom" overlay={"Regular proposals are passed or failed via absolute majority over a configured voting period. If enough GEN is staked predicting they will pass, they can move to the pending and then boosted queues."}>
                  <span>Regular Proposals ({pluginState.numberOfQueuedProposals})</span>
                </TrainingTooltip>
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
                  style={{overflow: "visible"}}
                  dataLength={proposalsQueued.length} //This is important field to render the next data
                  next={fetchMore}
                  hasMore={proposalsQueued.length < pluginState.numberOfQueuedProposals}
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
const SubscribedPluginProposalsPage = withSubscription<IProps, SubscriptionData>({
  wrappedComponent: PluginProposalsPage,
  loadingComponent: <Loading/>,
  errorComponent: null,

  checkForUpdate: (oldProps, newProps) => {
    return oldProps.pluginState.id !== newProps.pluginState.id;
  },

  createObservable: async (props: IExternalProps) => {
    const arc = getArc();
    const dao = new DAO(arc, props.daoState.id);
    const pluginId = props.pluginState.id;

    // this query will fetch al data we need before rendering the page, so we avoid hitting the server
    let bigProposalQuery;
    if (props.currentAccountAddress) {
      bigProposalQuery = gql`
        query ProposalDataForPluginProposalsPage {
          proposals (where: {
            scheme: "${pluginId}"
            stage_in: [
              "${IProposalStage[IProposalStage.Boosted]}",
              "${IProposalStage[IProposalStage.PreBoosted]}",
              "${IProposalStage[IProposalStage.Queued]}"
              "${IProposalStage[IProposalStage.QuietEndingPeriod]}",
            ]
          }){
            id
            accountsWithUnclaimedRewards
            boostedAt
            closingAt
            confidenceThreshold
            createdAt
            dao {
              id
              schemes {
                id
                address
              }
            }
            description
            descriptionHash
            executedAt
            executionState
            expiresInQueueAt
            genesisProtocolParams {
              id
              activationTime
              boostedVotePeriodLimit
              daoBountyConst
              limitExponentValue
              minimumDaoBounty
              preBoostedVotePeriodLimit
              proposingRepReward
              queuedVotePeriodLimit
              queuedVoteRequiredPercentage
              quietEndingPeriod
              thresholdConst
              votersReputationLossRatio
            }
            scheme {
              ...PluginFields
            }
            gpQueue {
              id
              threshold
              votingMachine
            }
            organizationId
            preBoostedAt
            proposer
            quietEndingPeriodBeganAt
            stage
            stakesFor
            stakesAgainst
            tags {
              id
            }
            totalRepWhenCreated
            totalRepWhenExecuted
            title
            url
            votesAgainst
            votesFor
            votingMachine
            winningOutcome
            votes (where: { voter: "${props.currentAccountAddress}"}) {
              ...VoteFields
            }
            stakes (where: { staker: "${props.currentAccountAddress}"}) {
              ...StakeFields
            }
            gpRewards (where: { beneficiary: "${props.currentAccountAddress}"}) {
              ...RewardFields
            }
            ${Object.values(Proposals)
              .filter((proposal) => proposal.fragment)
              .map((proposal) => '...' + proposal.fragment?.name)
              .join('\n')}
          }
        }
        ${Object.values(Proposals)
          .filter((proposal) => proposal.fragment)
          .map((proposal) => proposal.fragment?.fragment.loc?.source.body)
          .join('\n')}
        ${Vote.fragments.VoteFields}
        ${Stake.fragments.StakeFields}
        ${Reward.fragments.RewardFields}
        ${Plugin.baseFragment}
      `;
    } else {
      bigProposalQuery = gql`
        query ProposalDataForSchemeProposalsPage {
          proposals (where: {
            scheme: "${pluginId}"
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
        ${Proposal.baseFragment}
        ${Plugin.baseFragment}
      `;
    }

    return combineLatest(
      // the list of queued proposals
      dao.proposals({
        // eslint-disable-next-line @typescript-eslint/camelcase
        where: { plugin: pluginId, stage: IProposalStage.Queued },
        orderBy: "confidence",
        orderDirection: "desc",
        first: PAGE_SIZE,
        skip: 0,
      }, { subscribe: true }),

      // the list of preboosted proposals
      dao.proposals({
        where: { plugin: pluginId, stage: IProposalStage.PreBoosted },
        orderBy: "preBoostedAt",
      }, { subscribe: true }),

      // the list of boosted proposals
      dao.proposals({
        // eslint-disable-next-line @typescript-eslint/camelcase
        where: { plugin: pluginId, stage_in: [IProposalStage.Boosted, IProposalStage.QuietEndingPeriod] },
        orderBy: "boostedAt",
      }, { subscribe: true}),
      // big subscription query to make all other subscription queries obsolete
      arc.getObservable(bigProposalQuery, {subscribe: true}) as Observable<AnyProposal[]>,
    );
  },

  getFetchMoreObservable: (props: IExternalProps, data: SubscriptionData) => {
    const dao = new DAO(getArc(), props.daoState.id);

    return dao.proposals({
      // eslint-disable-next-line @typescript-eslint/camelcase
      where: { plugin: props.pluginState.id, stage: IProposalStage.Queued },
      orderBy: "confidence",
      orderDirection: "desc",
      first: PAGE_SIZE,
      skip: data[0].length,
    }, { subscribe: true, fetchAllData: true });
  },

  fetchMoreCombine: (prevState: SubscriptionData, newData: AnyProposal[]) => {
    return [prevState[0].concat(newData), prevState[1], prevState[2], []];
  },
});

export default connect(null, mapDispatchToProps)(SubscribedPluginProposalsPage);
