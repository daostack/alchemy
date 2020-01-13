import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { IRootState } from "reducers";
import { IProfileState, IProfilesState } from "reducers/profilesReducer";
import { IDAOState, IProposalState, ICompetitionSuggestion, Address } from "@daostack/client";
import { schemeName, humanProposalTitle, formatFriendlyDateForLocalTimezone, formatTokens } from "lib/util";
import { connect } from "react-redux";

import Countdown from "components/Shared/Countdown";
import TagsSelector from "components/Proposal/Create/SchemeForms/TagsSelector";
import RewardsString from "components/Proposal/RewardsString";
import { Link, RouteComponentProps } from "react-router-dom";
import classNames from "classnames";
import { showNotification } from "reducers/notifications";
import { enableWalletProvider } from "arc";
import CreateSubmission from "components/Scheme/ContributionRewardExtRewarders/Competition/CreateSubmission";
import { Modal } from "react-router-modal";
import SubmissionDetails from "components/Scheme/ContributionRewardExtRewarders/Competition/SubmissionDetails";
import StatusBlob from "components/Scheme/ContributionRewardExtRewarders/Competition/StatusBlob";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import * as CompetitionActions from "components/Scheme/ContributionRewardExtRewarders/Competition/utils";
import { combineLatest, of } from "rxjs";

import moment = require("moment");
import { ICreateSubmissionOptions, getProposalSubmissions, competitionStatus, ICompetitionStatus, ICompetitionSubmissionFake, getSubmissionVoterHasVoted } from "components/Scheme/ContributionRewardExtRewarders/Competition/utils";
import Tooltip from "rc-tooltip";
import { concatMap, toArray, first } from "rxjs/operators";
import * as css from "./Competitions.scss";

const ReactMarkdown = require("react-markdown");

type ISubscriptionState = [Array<ICompetitionSubmissionFake>, Array<boolean>];

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
  showingSubmissionDetails: ICompetitionSuggestion;
  status: ICompetitionStatus;
}

interface IExternalProps extends RouteComponentProps<any> {
  currentAccountAddress: Address;
  daoState: IDAOState;
  proposalState: IProposalState;
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

  private getCompetitionState = (): ICompetitionStatus => {
    const competition = this.props.proposalState.competition;
    const submissions = this.props.data[0];
    return competitionStatus(competition, submissions);
  }

  public componentDidMount() {
    const newState = {};
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
      let urlSubmission: ICompetitionSuggestion = null;
      if (urlSubmissionId) {
        const urlSubmissions = this.props.data[0].filter((submission: ICompetitionSuggestion) => submission.id === urlSubmissionId);
        if (urlSubmissions.length) {
          urlSubmission = urlSubmissions[0];
        }
      }

      if (this.state.showingSubmissionDetails !== urlSubmission) {
        Object.assign(newState, { showingSubmissionDetails: urlSubmission });
      }
    }
    this.setState(newState);
  }
  
  private onEndCountdown = () => {
    this.setState({ status: this.getCompetitionState() });
  }

  private openNewSubmissionModal = async (): Promise<void> => {
    
    const { showNotification } = this.props;

    if (!await enableWalletProvider({ showNotification })) { return; }

    this.setState({ showingCreateSubmission: true });
  }

  private submitNewSubmissionModal = async (options: ICreateSubmissionOptions): Promise<void> => {
    await this.props.createCompetitionSubmission(this.props.proposalState.id, options);

    this.setState({ showingCreateSubmission: false });
  }

  private cancelNewSubmissionModal = async (): Promise<void> => {
    this.setState({ showingCreateSubmission: false });
  }

  private openSubmissionDetailsModal = (suggestion: ICompetitionSuggestion) => async (): Promise<void> => {
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
  }

  private redeemSubmission = async (): Promise<void> => {
    const { showNotification } = this.props;

    if (!await enableWalletProvider({ showNotification })) { return; }

    await this.props.redeemForSubmission({ id: this.state.showingSubmissionDetails.id });
  }

  public render(): RenderOutput {
    
    const status = this.state.status;
    const { daoState, proposalState } = this.props;
    const submissions = this.props.data[0];
    const votersVotes = this.props.data[1];
    const tags = proposalState.tags;
    const competition = proposalState.competition;
    const now = moment();
    const canSubmit =  now.isSameOrAfter(status.startTime) && now.isBefore(status.submissionsEndTime);
    const hasNotStarted = now.isBefore(status.startTime);
    const hasEnded = now.isSameOrAfter(status.endTime);
    const inSubmissionsNotYetVoting = now.isSameOrAfter(status.startTime) && now.isBefore(status.votingStartTime);
    const inVoting = now.isSameOrAfter(status.votingStartTime) && now.isBefore(status.endTime);
    const winningSubmissions = submissions.filter((submission) => submission.isWinner);
    const noWinnersHtml = ()=> {
      return <div className={css.noWinners}>
        <div className={css.caption}>No Winners</div>
        <div className={css.body}>
          { 
            submissions.length ?
              "None of the competition submissions received any votes. Competition rewards will be returned to the DAO." :
              "This competition received no submissions. Competition rewards will be returned to the DAO."
          }
        </div>
      </div>;
    };
    const distributionsHtml = () => {
      return competition.rewardSplit.map((split: number, index: number) => {
        return (<div key={index} className={css.winner}>
          <div className={css.position}>{index+1}</div>
          <div className={css.proportion}>{split}%</div>
        </div>);
      });
    };
    const submissionsHtml = () => {

      return submissions.map((submission: ICompetitionSubmissionFake, index: number) => {
        const isSelected = () => this.state.showingSubmissionDetails && (this.state.showingSubmissionDetails.suggestionId === submission.suggestionId);
        return (
          <div key={index} className={css.row} onClick={this.openSubmissionDetailsModal(submission)}>
            { (hasEnded && winningSubmissions.length) ? 
              <div className={classNames({[css.cell]: true, [css.selected]: isSelected(), [css.winnerIcon]: true })}>
                {submission.isWinner ? <img src="/assets/images/Icon/winner.svg"></img> : ""}
              </div> : ""
            }
            <div className={classNames({[css.cell]: true, [css.selected]: isSelected(), [css.title]: true})}>
              { submission.title || "[No title is available]" }
            </div>
            <div className={classNames({[css.cell]: true, [css.selected]: isSelected(), [css.creator]: true})}>
              <AccountPopup accountAddress={submission.suggester} daoState={daoState}/>
              <AccountProfileName accountAddress={submission.suggester} accountProfile={this.props.profiles[submission.suggester]} daoAvatarAddress={daoState.address} detailView={false} />
            </div>
            <div className={classNames({[css.cell]: true, [css.selected]: isSelected(), [css.votes]: true})}>
              { formatTokens(submission.totalVotes) }
            </div>
            <div className={classNames({[css.cell]: true, [css.selected]: isSelected(), [css.votedUp]: true })}>
              <Tooltip placement="top" trigger={["hover"]} overlay={"You voted for this submission"}>
                {votersVotes[index] ? <img src="/assets/images/Icon/vote/for-fill-green.svg"></img> : <img src="/assets/images/Icon/vote/for-gray.svg"></img>}
              </Tooltip>
            </div>
          </div>);
      });
    };

    return <React.Fragment>
      <BreadcrumbsItem weight={1} to={`/dao/${daoState.address}/scheme/${proposalState.scheme.id}/crx`}>{schemeName(proposalState.scheme, proposalState.scheme.address)}</BreadcrumbsItem>
      <BreadcrumbsItem weight={2} to={`/dao/${daoState.address}/crx/proposal/${proposalState.id}`}>{humanProposalTitle(proposalState, 40)}</BreadcrumbsItem>

      <div className={css.competitionDetailsContainer}>
      
        <div className={css.topSection}>
          <div className={css.header}>
            <StatusBlob competition={competition} submissions={submissions}></StatusBlob>
            <div className={css.gotoProposal}><Link to={`/dao/${daoState.address}/proposal/${proposalState.id}`}>Go to Proposal&nbsp;&gt;</Link></div>
            <div className={css.newSubmission}>
              { canSubmit ? 
                <a className={css.blueButton}
                  href="javascript:void(0)"
                  onClick={this.openNewSubmissionModal}
                  data-test-id="createSuggestion"
                >+ New Submission</a>
                : ""
              }
            </div>
          </div>

          <div className={css.name}>{humanProposalTitle(proposalState)}</div>

          { hasNotStarted ?
            <div className={css.countdown}>
              <div className={css.startsIn}>Submissions start in:</div>
              <Countdown toDate={status.startTime} onEnd={this.onEndCountdown}/>
            </div> :
            inSubmissionsNotYetVoting ? 
              <div className={css.countdown}>
                <div className={css.startsIn}>Voting starts in:</div>
                <Countdown toDate={status.votingStartTime} onEnd={this.onEndCountdown}/>
              </div>
              : (inVoting && submissions.length) ? 
                <div className={css.countdown}>
                  <div className={css.startsIn}>Voting ends in:</div>
                  <Countdown toDate={status.endTime} onEnd={this.onEndCountdown}/>
                </div> : ""
          }
        </div>
        <div className={css.middleSection}>
          <div className={css.leftSection}>
            { tags && tags.length ? <div className={css.tagsContainer}>
              <TagsSelector readOnly darkTheme tags={tags}></TagsSelector>
            </div> : "" }

            <div className={css.description}>
              <ReactMarkdown source={proposalState.description}
                renderers={{link: (props: { href: string; children: React.ReactNode }) => {
                  return <a href={props.href} target="_blank" rel="noopener noreferrer">{props.children}</a>;
                }}}
              />
            </div>
          </div>
          <div className={css.rightSection}>
            <div className={css.header}>
              <div className={css.isWinner}><img src="/assets/images/Icon/winner.svg"></img></div>
              <div className={css.results}>
                <RewardsString proposal={proposalState} dao={daoState} />
                <img className={css.transferIcon} src="/assets/images/Icon/Transfer.svg" />
                <div className={css.winners}>{competition.numberOfWinners} anticipated winner(s)</div>
              </div>
            </div>
            <div className={css.distribution}>
              { distributionsHtml() }
            </div>
            <div className={css.allowedVote}>Up to {competition.numberOfVotesPerVoter} vote(s) allowed per account</div>
            <div className={css.periods}>
              <div className={css.period}>
                <div className={css.bullet}></div>
                <div className={css.label}>Competition start time:</div>
                <div className={css.datetime}>{formatFriendlyDateForLocalTimezone(status.startTime)}</div>
              </div>
              <div className={css.period}>
                <div className={css.bullet}></div>
                <div className={css.label}>Submission end time:</div>
                <div className={css.datetime}>{formatFriendlyDateForLocalTimezone(status.submissionsEndTime)}</div>
              </div>
              <div className={css.period}>
                <div className={css.bullet}></div>
                <div className={css.label}>Voting start time:</div>
                <div className={css.datetime}>{formatFriendlyDateForLocalTimezone(status.votingStartTime)}</div>
              </div>
              <div className={css.period}>
                <div className={css.bullet}></div>
                <div className={css.label}>Competition end time:</div>
                <div className={css.datetime}>{formatFriendlyDateForLocalTimezone(status.endTime)}</div>
              </div>
            </div>
          </div>
        </div>
        
        { submissions.length ?
          <div className={css.submissions}>
            <div className={css.heading}>{submissions.length}&nbsp;Submissions</div>
            <div className={css.list}>
              {submissionsHtml()}
            </div>
          </div> : ""
        }

        { (((inVoting && !submissions.length) || (hasEnded && !winningSubmissions.length))) ? noWinnersHtml() : "" }
      </div>
    
      {this.state.showingCreateSubmission ?
        <Modal onBackdropClick={this.cancelNewSubmissionModal}>
          <CreateSubmission
            proposalState={proposalState}
            daoState={daoState}
            handleCancel={this.cancelNewSubmissionModal}
            handleSubmit={this.submitNewSubmissionModal}></CreateSubmission>
        </Modal> : ""
      }

      {this.state.showingSubmissionDetails ?
        <Modal onBackdropClick={this.closeSubmissionDetailsModal}
          backdropClassName={css.submissionsModalBackdrop}>
          <SubmissionDetails
            currentAccountAddress={this.props.currentAccountAddress}
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
  errorComponent: (props) => <div>{ props.error.message }</div>,
  checkForUpdate: ["currentAccountAddress"],
  createObservable: (props: IExternalProps & IExternalStateProps ) => {
    /**
     * HEADS UP:  we subscribe here because we can't rely on getting to this component via CompetitionCard
     */
    const submissions = getProposalSubmissions(props.proposalState.id, true);

    return combineLatest(
      submissions,
      submissions.pipe(
        /**
         * Use `concatMap` because we want this second array to be in the same order as the first array.
         * Work on each array individually so that toArray can perceive closure on the stream of items in the array
         */ 
        concatMap(submissions => of(submissions).pipe(
          // spreads the array
          concatMap(submissions => submissions),
          // gets the boolean
          concatMap(submission => getSubmissionVoterHasVoted(submission.id, props.currentAccountAddress, true).pipe(first())),
          toArray())
        )
      )
    );
  },
});
