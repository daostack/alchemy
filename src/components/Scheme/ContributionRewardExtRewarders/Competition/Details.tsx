// import * as H from "history";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { IRootState } from "reducers";
import { IProfileState } from "reducers/profilesReducer";
import { IDAOState, IProposalState, ICompetitionSuggestion, Address } from "@daostack/client";
import { schemeName, humanProposalTitle, getDateWithTimezone, formatFriendlyDateForLocalTimezone, formatTokens } from "lib/util";
import { connect } from "react-redux";

import Countdown from "components/Shared/Countdown";
import TagsSelector from "components/Proposal/Create/SchemeForms/TagsSelector";
import RewardsString from "components/Proposal/RewardsString";
import { Link } from "react-router-dom";
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
import { concatMap } from "rxjs/operators";
import { forkJoin, combineLatest, Observable, of } from "rxjs";

import moment = require("moment");
import { ICreateSubmissionOptions, getProposalSubmissions, getSubmissionVoterHasVoted } from "components/Scheme/ContributionRewardExtRewarders/Competition/utils";
import Tooltip from "rc-tooltip";
import * as css from "./Competitions.scss";

const ReactMarkdown = require("react-markdown");

type ISubscriptionState = [Array<ICompetitionSuggestion>, Array<boolean>];

interface IDispatchProps {
  showNotification: typeof showNotification;
  createCompetitionSubmission: typeof CompetitionActions.createCompetitionSubmission;
  voteForSubmission: typeof CompetitionActions.voteForSubmission;
}

interface IStateProps {
  creatorProfile: IProfileState;
  showingCreateSubmission: boolean;
  showingSubmissionDetails: ICompetitionSuggestion;
}

interface IExternalProps /* extends RouteComponentProps<any> */ {
  currentAccountAddress: Address;
  daoState: IDAOState;
  proposalState: IProposalState;
  // history: H.History;
}

type IProps = IExternalProps & IDispatchProps & IStateProps & ISubscriptionProps<ISubscriptionState>;

const mapStateToProps = (state: IRootState & IStateProps, ownProps: IExternalProps): IExternalProps & IStateProps => {
  return {
    ...ownProps,
    creatorProfile: state.profiles[ownProps.proposalState.proposer],
    showingCreateSubmission: state.showingCreateSubmission,
    showingSubmissionDetails: state.showingSubmissionDetails,
  };
};

const mapDispatchToProps = {
  createCompetitionSubmission: CompetitionActions.createCompetitionSubmission,
  voteForSubmission: CompetitionActions.voteForSubmission,
  showNotification,
};

class CompetitionDetails extends React.Component<IProps, IStateProps> {

  constructor(props: IProps) {
    super(props);
    this.state = { 
      creatorProfile: null,
      showingCreateSubmission: false,
      showingSubmissionDetails: null,
    };
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

    this.setState({ showingSubmissionDetails: suggestion });
  }

  private voteOnSubmission = async (): Promise<void> => {
    const { showNotification } = this.props;

    if (!await enableWalletProvider({ showNotification })) { return; }

    await this.props.voteForSubmission({ id: this.state.showingSubmissionDetails.id });
  }

  private redeemSubmission = async (): Promise<void> => {
    const { showNotification } = this.props;

    if (!await enableWalletProvider({ showNotification })) { return; }
  }

  private closeSubmissionDetailsModal = async (): Promise<void> => {
    this.setState({ showingSubmissionDetails: null });
    return Promise.resolve(); // delete this when the actual vote is coded
  }

  public render(): RenderOutput {
    const { daoState, proposalState } = this.props;
    const submissions = this.props.data[0];
    const votersVotes = this.props.data[1];
    const tags = proposalState.tags;
    const competition = proposalState.competition;
    const now = moment();
    const notYetVoting = now.isBefore(competition.startTime);
    const startTime =         getDateWithTimezone(competition.startTime);
    const submissionsEndTime =  getDateWithTimezone(competition.suggestionsEndTime);
    const votingStartTime =   getDateWithTimezone(competition.votingStartTime);
    const endTime =           getDateWithTimezone(competition.endTime);
    const distributionsHtml = () => {
      return competition.rewardSplit.map((split: number, index: number) => {
        return (<div key={split} className={css.winner}>
          <div className={css.position}>{index+1}</div>
          <div className={css.proportion}>{split}%</div>
        </div>);
      });
    };
    const submissionsHtml = () => {

      return submissions.map((submission: ICompetitionSuggestion, index: number) => {
        const isSelected = () => this.state.showingSubmissionDetails && (this.state.showingSubmissionDetails.suggestionId === submission.suggestionId);
        return (
          <div key={index} className={css.row} onClick={this.openSubmissionDetailsModal(submission)}>
            {/*
              FAKE:  until we how to know if a winner.  Can't be a winner until competition is over
              */}
            <div className={classNames({[css.cell]: true, [css.selected]: isSelected(), [css.winnerIcon]: true, [css.isWinner]: true })}>
              <img src="/assets/images/Icon/winner.svg"></img>
            </div>
            <div className={classNames({[css.cell]: true, [css.selected]: isSelected(), [css.title]: true})}>
              { submission.title || "[No title is available]" }
            </div>
            <div className={classNames({[css.cell]: true, [css.selected]: isSelected(), [css.creator]: true})}>
              <AccountPopup accountAddress={proposalState.proposer} daoState={daoState}/>
              <AccountProfileName accountAddress={proposalState.proposer} accountProfile={this.props.creatorProfile} daoAvatarAddress={daoState.address} detailView={false} />
            </div>
            <div className={classNames({[css.cell]: true, [css.selected]: isSelected(), [css.votes]: true})}>
              { formatTokens(submission.totalVotes) }
            </div>
            {/*
              FAKE: know whether the current account has voted for the submission.
              */}
            <div className={classNames({[css.cell]: true, [css.selected]: isSelected(), [css.votedUp]: true, [css.didVote]: votersVotes[index] })}>
              <Tooltip placement="top" trigger={["hover"]} overlay={"You voted for this submission"}>
                <img src="/assets/images/Icon/vote/for-gray.svg"></img>
              </Tooltip>
            </div>
          </div>);
      });
    };

    return <React.Fragment>
      <BreadcrumbsItem weight={1} to={`/dao/${daoState.address}/scheme/${proposalState.scheme.id}/crx`}>{schemeName(proposalState.scheme, proposalState.scheme.address)}</BreadcrumbsItem>
      <BreadcrumbsItem weight={2} to={`/dao/${daoState.address}/crx/proposal/${proposalState.id}`}>{humanProposalTitle(proposalState)}</BreadcrumbsItem>

      <div className={css.competitionDetailsContainer}>
      
        <div className={css.topSection}>
          <div className={css.header}>
            <StatusBlob competition={competition}></StatusBlob>
            <div className={css.gotoProposal}><Link to={`/dao/${daoState.address}/proposal/${proposalState.id}`}>Go to Proposal&nbsp;&gt;</Link></div>
            <div className={css.newSubmission}>
              <a className={css.blueButton}
                href="javascript:void(0)"
                onClick={this.openNewSubmissionModal}
                data-test-id="createSuggestion"
              >+ New Submission</a>
            </div>
          </div>

          <div className={css.name}>{humanProposalTitle(proposalState)}</div>

          { notYetVoting ? 
            <div className={css.countdown}>
              <div className={css.startsIn}>Voting starts in:</div>
              <Countdown toDate={votingStartTime} />
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
                <div className={css.datetime}>{formatFriendlyDateForLocalTimezone(startTime)}</div>
              </div>
              <div className={css.period}>
                <div className={css.bullet}></div>
                <div className={css.label}>Submission end time:</div>
                <div className={css.datetime}>{formatFriendlyDateForLocalTimezone(submissionsEndTime)}</div>
              </div>
              <div className={css.period}>
                <div className={css.bullet}></div>
                <div className={css.label}>Voting start time:</div>
                <div className={css.datetime}>{formatFriendlyDateForLocalTimezone(votingStartTime)}</div>
              </div>
              <div className={css.period}>
                <div className={css.bullet}></div>
                <div className={css.label}>Competition end time:</div>
                <div className={css.datetime}>{formatFriendlyDateForLocalTimezone(endTime)}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className={css.submissions}>
          <div className={css.heading}>{submissions.length}&nbsp;Submissions</div>
          <div className={css.list}>
            {submissionsHtml()}
          </div>
        </div>
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
  checkForUpdate: [],
  createObservable: (props: IExternalProps & IStateProps ) => {
    /**
     * HEADS UP:  we subscribe here because we can't rely on getting to this component via CompetitionCard
     */
    const submissions = getProposalSubmissions(props.proposalState.id, true);

    return combineLatest(
      submissions,
      submissions.pipe(
        concatMap((submissions: Array<ICompetitionSuggestion>) => {
          if (!submissions.length) {
            return of([]);
          } else {
            // seems like there should be a more elegant rxjs way
            const observables: Array<Observable<boolean>> = [];
            submissions.forEach((submission) => observables.push(getSubmissionVoterHasVoted(submission.id, props.currentAccountAddress, true)));
            return forkJoin(observables);
          }
        })
      )
    );
  },
});
