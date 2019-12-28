// import * as H from "history";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { IRootState } from "reducers";
import { IProfileState } from "reducers/profilesReducer";
import { IDAOState, IProposalState, ICompetitionSuggestion, CompetitionSuggestion, Competition } from "@daostack/client";
import { schemeName, humanProposalTitle, getDateWithTimezone, formatFriendlyDateForLocalTimezone, formatTokens } from "lib/util";
import { connect } from "react-redux";

import Countdown from "components/Shared/Countdown";
import TagsSelector from "components/Proposal/Create/SchemeForms/TagsSelector";
import RewardsString from "components/Proposal/RewardsString";
import { Link } from "react-router-dom";
import classNames from "classnames";
import { showNotification } from "reducers/notifications";
import { enableWalletProvider, getArc } from "arc";
import CreateSolution, { ICreateSolutionOptions } from "components/Scheme/ContributionRewardExtRewarders/Competition/CreateSolution";
import { Modal } from "react-router-modal";
import SolutionDetails from "components/Scheme/ContributionRewardExtRewarders/Competition/SolutionDetails";
import StatusBlob from "components/Scheme/ContributionRewardExtRewarders/Competition/StatusBlob";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { map } from "rxjs/operators";
import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import * as CompetitionActions from "components/Scheme/ContributionRewardExtRewarders/Competition/utils";

import moment = require("moment");
import * as css from "./Competitions.scss";

const ReactMarkdown = require("react-markdown");

type ISubscriptionState = Array<ICompetitionSuggestion>;

interface IDispatchProps {
  showNotification: typeof showNotification;
  createCompetitionSolution: typeof CompetitionActions.createCompetitionSolution;
}

interface IStateProps {
  creatorProfile: IProfileState;
  showingCreateSolution: boolean;
  showingSolutionDetails: string;
}

interface IExternalProps /* extends RouteComponentProps<any> */ {
  daoState: IDAOState;
  proposalState: IProposalState;
  // history: H.History;
}

type IProps = IExternalProps & IDispatchProps & IStateProps & ISubscriptionProps<ISubscriptionState>;

const mapStateToProps = (state: IRootState & IStateProps, ownProps: IExternalProps): IExternalProps & IStateProps => {
  return {
    ...ownProps,
    creatorProfile: state.profiles[ownProps.proposalState.proposer],
    showingCreateSolution: state.showingCreateSolution,
    showingSolutionDetails: state.showingSolutionDetails,
  };
};

const mapDispatchToProps = {
  createCompetitionSolution: CompetitionActions.createCompetitionSolution,
  showNotification,
};

class CompetitionDetails extends React.Component<IProps, IStateProps> {

  constructor(props: IProps) {
    super(props);
    this.state = { 
      creatorProfile: null,
      showingCreateSolution: false,
      showingSolutionDetails: null,
    };
  }

  private openNewSolutionModal = async (): Promise<void> => {
    
    const { showNotification } = this.props;

    if (!await enableWalletProvider({ showNotification })) { return; }

    this.setState({ showingCreateSolution: true });
  }

  private submitNewSolutionModal = async (options: ICreateSolutionOptions): Promise<void> => {
    await this.props.createCompetitionSolution(this.props.proposalState.id, options);

    this.setState({ showingCreateSolution: false });
  }

  private cancelNewSolutionModal = async (): Promise<void> => {
    this.setState({ showingCreateSolution: false });
  }

  private openSolutionDetailsModal = (suggestionId: string) => async (): Promise<void> => {

    this.setState({ showingSolutionDetails: suggestionId });
  }

  private voteOnSolution = async (): Promise<void> => {
    const { showNotification } = this.props;

    if (!await enableWalletProvider({ showNotification })) { return; }
  
    this.setState({ showingSolutionDetails: null });
  }

  private redeemSolution = async (): Promise<void> => {
    const { showNotification } = this.props;

    if (!await enableWalletProvider({ showNotification })) { return; }
  
    this.setState({ showingSolutionDetails: null });
  }

  private closeSolutionDetailsModal = async (): Promise<void> => {
    this.setState({ showingSolutionDetails: null });
    return Promise.resolve(); // delete this when the actual vote is coded
  }

  public render(): RenderOutput {
    const { daoState, proposalState } = this.props;
    const solutions = this.props.data;
    const tags = proposalState.tags;
    const competition = proposalState.competition;
    const now = moment();
    const notYetVoting = now.isBefore(competition.startTime);
    const startTime =         getDateWithTimezone(competition.startTime);
    const solutionsEndTime =  getDateWithTimezone(competition.suggestionsEndTime);
    const votingStartTime =   getDateWithTimezone(competition.votingStartTime);
    const endTime =           getDateWithTimezone(competition.endTime);
    const distributionsHtml = () => {
      return [
        <div key={0} className={css.winner}>
          <div className={css.position}>1st</div>
          <div className={css.proportion}>60%</div>
        </div>,
        <div key={1} className={css.winner}>
          <div className={css.position}>2nd</div>
          <div className={css.proportion}>40%</div>
        </div>,
      ];

      /** the following is wrong
      return solutions
        .sort((a: ICompetitionSuggestion, b: ICompetitionSuggestion) => b.rewardPercentage - a.rewardPercentage)
        .map((solution: ICompetitionSuggestion, index: number) => {
          return <div key={index} className={css.winner}>
            <div className={css.position}>{index+1}</div>
            <div className={css.proportion}>{solution.rewardPercentage}%</div>
          </div>;
        });
         */
    };
    const solutionsHtml = () => {

      return solutions.map((solution: ICompetitionSuggestion, index: number) => {
        const isSelected = () => this.state.showingSolutionDetails === solution.id;
        return (
          <div key={index} className={css.row} onClick={this.openSolutionDetailsModal(solution.id)}>
            {/*
              FAKE:  until we how to know if a winner.  Can't be a winner until competition is over
              */}
            <div className={classNames({[css.cell]: true, [css.selected]: isSelected(), [css.winnerIcon]: true, [css.isWinner]: true })}>
              <img src="/assets/images/Icon/winner.svg"></img>
            </div>
            <div className={classNames({[css.cell]: true, [css.selected]: isSelected(), [css.title]: true})}>
              { solution.title || "[No title is available]" }
            </div>
            <div className={classNames({[css.cell]: true, [css.selected]: isSelected(), [css.creator]: true})}>
              <AccountPopup accountAddress={proposalState.proposer} daoState={daoState}/>
              <AccountProfileName accountAddress={proposalState.proposer} accountProfile={this.props.creatorProfile} daoAvatarAddress={daoState.address} detailView={false} />
            </div>
            <div className={classNames({[css.cell]: true, [css.selected]: isSelected(), [css.votes]: true})}>
              { formatTokens(solution.totalVotes) }
            </div>
            {/*
              FAKE: know whether the current account has voted for the solution.
              */}
            <div className={classNames({[css.cell]: true, [css.selected]: isSelected(), [css.votedUp]: true, [css.didVote]: true })}>
              <img src="/assets/images/Icon/vote/for-gray.svg"></img>
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
            <div className={css.newSolution}>
              <a className={css.blueButton}
                href="javascript:void(0)"
                onClick={this.openNewSolutionModal}
                data-test-id="createSuggestion"
              >+ New Solution</a>
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
            <div className={css.allowedVote}>Up to {competition.numberOfVotesPerVoter} votes allowed per account</div>
            <div className={css.periods}>
              <div className={css.period}>
                <div className={css.bullet}></div>
                <div className={css.label}>Competition start time:</div>
                <div className={css.datetime}>{formatFriendlyDateForLocalTimezone(startTime)}</div>
              </div>
              <div className={css.period}>
                <div className={css.bullet}></div>
                <div className={css.label}>Submission end time:</div>
                <div className={css.datetime}>{formatFriendlyDateForLocalTimezone(solutionsEndTime)}</div>
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
        
        <div className={css.solutions}>
          <div className={css.heading}>{solutions.length} Solutions</div>
          <div className={css.list}>
            {solutionsHtml()}
          </div>
        </div>
      </div>
    
      {this.state.showingCreateSolution ?
        <Modal onBackdropClick={this.cancelNewSolutionModal}>
          <CreateSolution
            proposalState={proposalState}
            daoState={daoState}
            handleCancel={this.cancelNewSolutionModal}
            handleSubmit={this.submitNewSolutionModal}></CreateSolution>
        </Modal> : ""
      }

      {this.state.showingSolutionDetails ?
        <Modal onBackdropClick={this.closeSolutionDetailsModal}>
          <SolutionDetails
            suggestionId={this.state.showingSolutionDetails}
            proposalState={proposalState}
            daoState={daoState}
            handleClose={this.closeSolutionDetailsModal}
            handleVote={this.voteOnSolution}
            handleRedeem={this.redeemSolution}></SolutionDetails>
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
  createObservable: (props: IExternalProps) => {
    // FAKE -- until we have IProposalState.competition.suggestions()
    const competition = new Competition(props.proposalState.id, getArc());
    // return props.proposalState.competition.suggestions({ where: { proposal: props.proposalState.id }}, { subscribe: true } )
    return competition.suggestions({ where: { proposal: props.proposalState.id }}, { subscribe: true, fetchAllData: true } )
      .pipe(
        map((suggestions: Array<CompetitionSuggestion>) => suggestions.map((suggestion) => suggestion.staticState ))
      );
  },
});
