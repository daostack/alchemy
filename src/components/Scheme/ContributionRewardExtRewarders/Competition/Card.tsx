import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import { humanProposalTitle } from "lib/util";
import * as React from "react";
import { Link } from "react-router-dom";
import RewardsString from "components/Proposal/RewardsString";
import { IDAOState, IProposalState, CompetitionVote, ICompetitionSuggestionState } from "@daostack/client";
import { IProfileState } from "reducers/profilesReducer";
import { IRootState } from "reducers";
import { connect } from "react-redux";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { combineLatest } from "rxjs";
import CountdownText from "components/Scheme/ContributionRewardExtRewarders/Competition/CountdownText";
import StatusBlob from "./StatusBlob";
import * as css from "./Competitions.scss";
import { competitionStatus, getProposalSubmissions, getCompetitionVotes, CompetitionStatus } from "./utils";

type ISubscriptionState = [Array<ICompetitionSuggestionState>, Array<CompetitionVote>];

interface IExternalStateProps {
  creatorProfile: IProfileState;
}

interface IStateProps {
  status: CompetitionStatus;
}

interface IExternalProps {
  daoState: IDAOState;
  proposalState: IProposalState;
  handleStatusChange: (proposal: IProposalState, newStatus: CompetitionStatus) => void;
}

type IProps = IExternalProps & IExternalStateProps & ISubscriptionProps<ISubscriptionState>;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IExternalStateProps => {

  return {
    ...ownProps,
    creatorProfile: state.profiles[ownProps.proposalState.proposer],
  };
};

class CompetitionCard extends React.Component<IProps, IStateProps> {

  constructor(props: IProps) {
    super(props);
    const status = this.getCompetitionState();
    this.state = { status };
    // give the status to who wants it
    this.fireHandleChange(status);
  }

  private getCompetitionState = (): CompetitionStatus => {
    const competition = this.props.proposalState.competition;
    const submissions = this.props.data[0];
    return competitionStatus(competition, submissions);
  }

  private fireHandleChange(status: CompetitionStatus) {
    this.props.handleStatusChange(this.props.proposalState, status);
  }

  private onEndCountdown = () => {
    // paranoia about timer inprecision
    setTimeout(() => {
      const status = this.getCompetitionState();
      this.fireHandleChange(status);
      this.setState({ status: status });
    }, 1000);
  }

  public render(): RenderOutput {
    const status = this.state.status;

    const {
      creatorProfile,
      daoState,
      proposalState,
    } = this.props;

    const competition = proposalState.competition;
    const submissions = this.props.data[0];
    const votes = this.props.data[1];
    const numWinningSubmissions = submissions.filter((submission) => submission.isWinner).length;
    const ended = status.now.isSameOrAfter(competition.endTime);

    return <div className={css.competitionCardContainer} data-test-id={"competition-card-" + proposalState.id}>
      <StatusBlob competition={competition} submissions={submissions}></StatusBlob>
      <div className={css.createByContainer}>
        <div className={css.createdBy}>
          <AccountPopup accountAddress={proposalState.proposer} daoState={daoState}/>
          <AccountProfileName accountAddress={proposalState.proposer} accountProfile={creatorProfile} daoAvatarAddress={daoState.address} detailView={false} />
        </div>
        <div className={css.countdown}>
          <CountdownText status={status} competition={competition} submissions={submissions} onEndCountdown={this.onEndCountdown}></CountdownText>
        </div>
      </div>
      <div className={css.description}>
        <Link className={css.detailLink} to={"/dao/" + daoState.address +  "/crx/proposal/" + proposalState.id} data-test-id="proposal-title">
          <div className={css.name}>{humanProposalTitle(proposalState)}</div>
        </Link>
      </div>
      <div className={css.rewards}>
        <div className={css.winnerIcon}>
          { ended && numWinningSubmissions ? <img src="/assets/images/Icon/winner.svg"></img>  : "" }
        </div>
        <div className={css.transferType}><RewardsString proposal={proposalState} dao={daoState} /></div>
        <img src="/assets/images/Icon/Transfer.svg" />
        { ended && numWinningSubmissions ?
          <div className={css.winners}>{numWinningSubmissions} winners</div> :
          <div className={css.winners}>{competition.numberOfWinners} anticipated winners</div>
        }
      </div>
      <div className={css.activityContainer}>
        <div className={css.suggestions}>{submissions.length} Submissions | {votes.length} Votes</div>
        <div className={css.comments}></div>
      </div>
    </div>;
  }
}

const CompetitionCardConnected = connect(mapStateToProps)(CompetitionCard);

export default withSubscription({
  wrappedComponent: CompetitionCardConnected,
  loadingComponent: null,
  errorComponent: (props) => <div>{ props.error.message }</div>,
  checkForUpdate: [],
  createObservable: (props: IExternalProps) => {
    /**
     * Would be better to prime for all cards
     */
    return combineLatest(
      getProposalSubmissions(props.proposalState.id, true),
      getCompetitionVotes(props.proposalState.id, null, true),
    );
  },
});
