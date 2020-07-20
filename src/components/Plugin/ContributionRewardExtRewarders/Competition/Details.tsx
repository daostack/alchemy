import { IRootState } from "reducers";
import { IProfilesState } from "reducers/profilesReducer";
import { humanProposalTitle, formatFriendlyDateForLocalTimezone, formatTokens, isAddress } from "lib/util";
import TagsSelector from "components/Proposal/Create/PluginForms/TagsSelector";
import RewardsString from "components/Proposal/RewardsString";
import { showNotification } from "reducers/notifications";
import { enableWalletProvider, getArc } from "arc";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import CountdownText from "components/Plugin/ContributionRewardExtRewarders/Competition/CountdownText";
import { map } from "rxjs/operators";
import Tooltip from "rc-tooltip";
import { combineLatest, of } from "rxjs";
import { Modal } from "react-router-modal";
import classNames from "classnames";
import { Link, RouteComponentProps } from "react-router-dom";
import { DiscussionEmbed } from "disqus-react";
import { connect } from "react-redux";
import {
  IDAOState, ICompetitionSuggestionState, Address, CompetitionVote, IProposalOutcome,
  CompetitionSuggestion, Proposal, ICompetitionProposalState, Plugin,
} from "@daostack/arc.js";
import gql from "graphql-tag";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import * as React from "react";
import { ICreateSubmissionOptions, getProposalSubmissions, competitionStatus, CompetitionStatus, getCompetitionVotes } from "./utils";
import CreateSubmission from "./CreateSubmission";
import SubmissionDetails from "./SubmissionDetails";
import StatusBlob from "./StatusBlob";
import * as css from "./Competitions.scss";
import * as CompetitionActions from "./utils";
import ProposalDescription from "components/Shared/ProposalDescription";

type ISubscriptionState = [Array<ICompetitionSuggestionState>, Set<string>];

interface IDispatchProps {
  showNotification: typeof showNotification;
  createCompetitionSubmission: typeof CompetitionActions.createCompetitionSubmission;
  voteForSubmission: typeof CompetitionActions.voteForSubmission;
  redeemForSubmission: typeof CompetitionActions.redeemForSubmission;
}

interface IExternalStateProps {
  profiles: IProfilesState;
}

interface IStateProps {
  showingCreateSubmission: boolean;
  showingSubmissionDetails: ICompetitionSuggestionState;
  status: CompetitionStatus;
}

interface IExternalProps extends RouteComponentProps<any> {
  currentAccountAddress: Address;
  daoState: IDAOState;
  proposalState: ICompetitionProposalState;
}

type IProps = IExternalProps & IDispatchProps & IExternalStateProps & ISubscriptionProps<ISubscriptionState>;

const mapStateToProps = (state: IRootState & IExternalStateProps, ownProps: IExternalProps): IExternalProps & IExternalStateProps => {
  return {
    ...ownProps,
    profiles: state.profiles,
  };
};

const mapDispatchToProps = {
  createCompetitionSubmission: CompetitionActions.createCompetitionSubmission,
  voteForSubmission: CompetitionActions.voteForSubmission,
  redeemForSubmission: CompetitionActions.redeemForSubmission,
  showNotification,
};

class CompetitionDetails extends React.Component<IProps, IStateProps> {

  constructor(props: IProps) {
    super(props);
    this.state = {
      showingCreateSubmission: false,
      showingSubmissionDetails: null,
      status: this.getCompetitionState(),
    };
  }

  private disqusConfig = { url: "", identifier: "", title: "" };

  private getCompetitionState = (): CompetitionStatus => {
    const competition = this.props.proposalState;
    return competitionStatus(competition);
  }

  public async componentDidMount() {
    /**
     * use `window` because a route with these params isn't configured
     * externally to the Competition code in Alchemy, and thus the params
     * won't show up in `match`.  (Wasn't able to figure out a clean/easy way to
     * configure such a route, and the behavior may be better this way anyway;
     * not using React's router I believe helps to keep the history and
     * browser back/forward button behavior nice and clean.)
     */
    const parts = window.location.pathname.split("/");

    if (parts.length === 9) {
      const urlSubmissionId = parts[8];
      let urlSubmission: ICompetitionSuggestionState = null;
      if (urlSubmissionId) {
        const urlSubmissions = this.props.data[0].filter((submission: ICompetitionSuggestionState) => submission.id === urlSubmissionId);
        if (urlSubmissions.length) {
          urlSubmission = urlSubmissions[0];
        }
      }

      if (this.state.showingSubmissionDetails !== urlSubmission) {
        this.setState({ showingSubmissionDetails: urlSubmission });
      }
    } else if ((parts.length === 7) && (parts[6] === "createSubmission")) {
      if (!this.state.showingCreateSubmission) {
        await this.openNewSubmissionModal();
      }
    }
  }

  private onEndCountdown = () => {
    // give it time to catch up with timer inprecision
    setTimeout(() => this.setState({ status: this.getCompetitionState() }), 1000);
  }

  private openNewSubmissionModal = async (): Promise<void> => {

    const { showNotification } = this.props;

    if (!await enableWalletProvider({ showNotification })) { return; }

    this.setState({ showingCreateSubmission: true });

    this.props.history.replace(`/dao/${this.props.daoState.address}/crx/proposal/${this.props.proposalState.id}/createSubmission`);
  }

  private submitNewSubmissionModal = async (options: ICreateSubmissionOptions): Promise<void> => {
    await this.props.createCompetitionSubmission(this.props.proposalState.id, options);

    this.setState({ showingCreateSubmission: false });
    this.props.history.replace(`/dao/${this.props.daoState.address}/crx/proposal/${this.props.proposalState.id}`);
  }

  private cancelNewSubmissionModal = async (): Promise<void> => {
    this.setState({ showingCreateSubmission: false });
    this.props.history.replace(`/dao/${this.props.daoState.address}/crx/proposal/${this.props.proposalState.id}`);
  }

  private openSubmissionDetailsModal = (suggestion: ICompetitionSuggestionState) => async (): Promise<void> => {
    this.props.history.replace(`/dao/${this.props.daoState.address}/crx/proposal/${this.props.proposalState.id}/competition/submission/${suggestion.id}`);
    this.setState({ showingSubmissionDetails: suggestion });
  }

  private closeSubmissionDetailsModal = async (): Promise<void> => {
    this.props.history.replace(`/dao/${this.props.daoState.address}/crx/proposal/${this.props.proposalState.id}`);
    this.setState({ showingSubmissionDetails: null });
  }

  private voteOnSubmission = async (): Promise<void> => {
    const { showNotification } = this.props;

    if (!await enableWalletProvider({ showNotification })) { return; }

    await this.props.voteForSubmission({ id: this.state.showingSubmissionDetails.id });
    // this.state.votedSuggestions.add(this.state.showingSubmissionDetails.id);
    // this.setState({ votedSuggestions: this.state.votedSuggestions });
  }

  private redeemSubmission = async (): Promise<void> => {
    const { showNotification } = this.props;

    if (!await enableWalletProvider({ showNotification })) { return; }

    await this.props.redeemForSubmission({ id: this.state.showingSubmissionDetails.id });
  }

  private distributionsHtml() {
    return this.props.proposalState.rewardSplit.map((split: number, index: number) => {
      return (<div key={index} className={css.winner}>
        <div className={css.position}>{index + 1}</div>
        <div className={css.proportion}>{split}%</div>
      </div>);
    });
  }

  private noWinnersHtml() {
    const hasSubmissions = this.props.data[0].length;
    return <div className={css.noWinners}>
      <div className={css.caption}>No Winners</div>
      <div className={css.body}>
        {
          hasSubmissions ?
            "None of the competition submissions received any votes. Competition rewards will be returned to the DAO." :
            "This competition received no submissions. Competition rewards will be returned to the DAO."
        }
      </div>
    </div>;
  }

  private submissionsHtml() {
    const submissions = this.props.data[0];
    const { daoState } = this.props;
    const status = this.state.status;

    return submissions.map((submission: ICompetitionSuggestionState, index: number) => {
      const isSelected = () => this.state.showingSubmissionDetails && (this.state.showingSubmissionDetails.suggestionId === submission.suggestionId);
      const votesMap = this.props.data[1];
      const voted = votesMap.has(submission.id);
      return (
        <React.Fragment key={index}>
          {status.overWithWinners ?
            <div className={classNames({
              [css.cell]: true,
              [css.selected]: isSelected(),
              [css.winnerIcon]: true,
            })}
            onClick={this.openSubmissionDetailsModal(submission)}>
              {submission.isWinner ? <img src="/assets/images/Icon/winner.svg"></img> : ""}
            </div> : ""}
          <div className={classNames({ [css.cell]: true, [css.selected]: isSelected(), [css.title]: true })}
            onClick={this.openSubmissionDetailsModal(submission)}>
            {submission.title || "[No title is available]"}
          </div>
          <div className={classNames({ [css.cell]: true, [css.selected]: isSelected(), [css.creator]: true })}
            onClick={this.openSubmissionDetailsModal(submission)}>
            <AccountPopup accountAddress={submission.beneficiary} daoState={daoState} />
            <AccountProfileName accountAddress={submission.beneficiary} accountProfile={this.props.profiles[submission.beneficiary]} daoAvatarAddress={daoState.address} detailView={false} />
          </div>
          <div className={classNames({ [css.cell]: true, [css.selected]: isSelected(), [css.votingSection]: true })}>
            <div className={css.votes}
              onClick={this.openSubmissionDetailsModal(submission)}>
              {formatTokens(submission.totalVotes)} Rep{/*<Reputation daoName={daoState.name} totalReputation={daoState.reputationTotalSupply} reputation={submission.totalVotes} hideSymbol/>*/}
            </div>
            <div className={css.votedUp}
              onClick={this.openSubmissionDetailsModal(submission)}>
              <Tooltip placement="top" trigger={voted ? ["hover"] : []} overlay={"You voted for this submission"}>
                {voted ? <img src="/assets/images/Icon/vote/for-fill-green.svg"></img> : <img src="/assets/images/Icon/vote/for-gray.svg"></img>}
              </Tooltip>
            </div>
          </div>
        </React.Fragment>
      );
    });
  }

  public render(): RenderOutput {

    const status = this.state.status;
    const { daoState, proposalState } = this.props;
    const submissions = this.props.data[0];
    const tags = proposalState.tags;
    const competition = proposalState;
    const notStarted = status.notStarted;
    const inSubmissions = status.open;
    const isPaused = status.paused;
    const inVoting = status.inVotingPeriod;
    const voting = status.voting;
    const isOver = status.over;
    const overWithWinners = status.overWithWinners;
    const numSubmissions = submissions.length;
    const hasSubmissions = !!numSubmissions;

    const submissionsAreDisabled = notStarted ||
      // note that winningOutcome is the *current* state, not necessarily the *final* outcome
      (!proposalState.executedAt || (proposalState.winningOutcome !== IProposalOutcome.Pass))
      || (isAddress(competition.admin) && (this.props.currentAccountAddress !== competition.admin))
      ;

    this.disqusConfig.title = proposalState.title;
    this.disqusConfig.url = process.env.BASE_URL + this.props.history.location.pathname;
    this.disqusConfig.identifier = `competition-${proposalState.id}`;

    return <React.Fragment>
      <BreadcrumbsItem weight={1} to={`/dao/${daoState.address}/plugin/${proposalState.plugin.id}/crx`}>Competition</BreadcrumbsItem>
      <BreadcrumbsItem weight={2} to={`/dao/${daoState.address}/crx/proposal/${proposalState.id}`}>{humanProposalTitle(proposalState, 40)}</BreadcrumbsItem>

      <div className={css.competitionDetailsContainer}>

        <div className={css.topSection}>
          <div className={css.header}>
            <StatusBlob competition={competition}></StatusBlob>
            <div className={css.gotoProposal}><Link to={`/dao/${daoState.address}/proposal/${proposalState.id}`}>Go to Proposal&nbsp;&gt;</Link></div>
            {status.now.isBefore(status.competition.suggestionsEndTime) ?
              <div className={css.newSubmission}>
                {
                  <Tooltip overlay={
                    (!proposalState.executedAt || (proposalState.winningOutcome !== IProposalOutcome.Pass)) ? "The competition proposal has not been approved" :
                      notStarted ? "The submission period has not yet begun" :
                        (isAddress(competition.admin) && (this.props.currentAccountAddress !== competition.admin)) ? "Only the \"admin\" user is allowed to create submissions" :
                          "Create a submission"
                  }
                  >
                    <a className={classNames({ [css.blueButton]: true, [css.disabled]: submissionsAreDisabled })}
                      href="#!"
                      onClick={submissionsAreDisabled ? undefined : this.openNewSubmissionModal}
                      data-test-id="createSuggestion"
                    >+ New Submission</a>
                  </Tooltip>
                }
              </div>
              : ""
            }
          </div>

          <div className={css.name}>{humanProposalTitle(proposalState)}</div>
          <div className={css.countdown}>
            <CountdownText status={status} competition={competition} onEndCountdown={this.onEndCountdown}></CountdownText>
          </div>
        </div>
        <div className={css.middleSection}>
          <div className={css.leftSection}>
            {tags && tags.length ? <div className={css.tagsContainer}>
              <TagsSelector readOnly darkTheme tags={tags}></TagsSelector>
            </div> : ""}

            <div className={classNames({ [css.description]: true, [css.hasSubmissions]: hasSubmissions })}>
              <ProposalDescription description={proposalState.description} />
            </div>
          </div>
          <div className={css.rightSection}>
            <div className={css.header}>
              <div className={css.isWinner}><img src="/assets/images/Icon/winner.svg"></img></div>
              <div className={css.results}>
                <RewardsString proposalState={proposalState} daoState={daoState} />
                <img className={css.transferIcon} src="/assets/images/Icon/Transfer.svg" />
                <div className={css.winners}>{competition.numberOfWinners} anticipated winner(s)</div>
              </div>
            </div>
            <div className={css.distribution}>
              {this.distributionsHtml()}
            </div>
            <div className={css.allowedVote}>Up to {competition.numberOfVotesPerVoter} vote(s) allowed per account</div>
            <div className={css.periods}>
              <div className={css.period}>
                <div className={classNames({ [css.bullet]: true, [css.inPeriod]: notStarted })}></div>
                <div className={css.label}>Competition start time:</div>
                <div className={css.datetime}>{formatFriendlyDateForLocalTimezone(competition.startTime)}</div>
              </div>
              <div className={css.period}>
                <div className={classNames({ [css.bullet]: true, [css.inPeriod]: inSubmissions })}></div>
                <div className={css.label}>Submission end time:</div>
                <div className={css.datetime}>{formatFriendlyDateForLocalTimezone(competition.suggestionsEndTime)}</div>
              </div>
              <div className={css.period}>
                <div className={classNames({ [css.bullet]: true, [css.inPeriod]: isPaused })}></div>
                <div className={css.label}>Voting start time:</div>
                <div className={css.datetime}>{formatFriendlyDateForLocalTimezone(competition.votingStartTime)}</div>
              </div>
              <div className={css.period}>
                <div className={classNames({ [css.bullet]: true, [css.inPeriod]: inVoting })}></div>
                <div className={css.label}>Competition end time:</div>
                <div className={css.datetime}>{formatFriendlyDateForLocalTimezone(competition.endTime)}</div>
              </div>
            </div>
          </div>
        </div>

        {hasSubmissions ?
          <div className={css.submissions}>
            <div className={css.heading}>{numSubmissions}&nbsp;Submissions</div>
            <div className={classNames({ [css.list]: true, [css.overWithWinners]: status.overWithWinners })}>
              {this.submissionsHtml()}
            </div>
          </div> : ""
        }

        {((inVoting && !voting) || (isOver && !overWithWinners)) ? this.noWinnersHtml() : ""}

        <div className={css.discussionContainer}>
          <div className={css.title}>Discussion</div>
          <div className={css.disqus}>
            <DiscussionEmbed shortname={process.env.DISQUS_SITE} config={this.disqusConfig} />
          </div>
        </div>

      </div>

      {this.state.showingCreateSubmission ?
        <Modal onBackdropClick={this.cancelNewSubmissionModal}>
          <CreateSubmission
            proposalState={proposalState}
            daoState={daoState}
            handleCancel={this.cancelNewSubmissionModal}
            handleSubmit={this.submitNewSubmissionModal}
            currentAccountAddress={this.props.currentAccountAddress}></CreateSubmission>
        </Modal> : ""
      }

      {this.state.showingSubmissionDetails ?
        <Modal onBackdropClick={this.closeSubmissionDetailsModal}
          backdropClassName={css.submissionsModalBackdrop}>
          <SubmissionDetails
            match={this.props.match}
            history={this.props.history}
            location={this.props.location}
            staticContext={this.props.staticContext}
            currentAccountAddress={this.props.currentAccountAddress}
            status={this.state.status}
            suggestionId={this.state.showingSubmissionDetails.id}
            proposalState={proposalState}
            daoState={daoState}
            handleClose={this.closeSubmissionDetailsModal}
            handleVote={this.voteOnSubmission}
            handleRedeem={this.redeemSubmission}></SubmissionDetails>
        </Modal> : ""
      }

    </React.Fragment>;
  }
}

const CompetitionDetailsConnected = connect(mapStateToProps, mapDispatchToProps)(CompetitionDetails);

export default withSubscription({
  wrappedComponent: CompetitionDetailsConnected,
  loadingComponent: null,
  errorComponent: (props) => <div>{props.error.message}</div>,
  checkForUpdate: ["currentAccountAddress"],
  createObservable: async (props: IExternalProps & IExternalStateProps) => {

    // Ensure the plugin's state is hydrated
    await props.proposalState.plugin.entity.fetchState();

    // prime the cache and subscribe
    const cacheQuery = gql`query cacheSuggestions {
      proposals (where: {id: "${props.proposalState.id}"}) {
        ...ProposalFields
        competition {
          id
          suggestions {
            ...CompetitionSuggestionFields
          }
        }
      }
    }
    ${Proposal.baseFragment}
    ${Plugin.baseFragment}
    ${CompetitionSuggestion.fragments.CompetitionSuggestionFields}
    `;

    console.log(getArc, cacheQuery);
    // const arc = await getArc();
    // // sending the query before subscribing seems to resolve a weird cache error - this would ideally be handled in the arc.js
    // await arc.sendQuery(cacheQuery);
    // // eslint-disable-next-line @typescript-eslint/no-empty-function
    // await arc.getObservable(cacheQuery, {subscribe: true}).subscribe(() => {});
    // end cache priming

    return combineLatest(
      // we do not need to subscribe here (second argument = false), because we already subscribed in the line above
      getProposalSubmissions(props.proposalState.id, true),
      // the next construction gets the suggestions for which the user has voted
      props.currentAccountAddress ? getCompetitionVotes(props.proposalState.id, props.currentAccountAddress, true)
        .pipe(
          map((votes: Array<CompetitionVote>) => {
            const set = new Set<string>();
            votes.forEach(vote => {
              set.add(vote.coreState.suggestion);
            });
            return set;
          })
        ) : of(new Set<string>())
    );
  },
});
