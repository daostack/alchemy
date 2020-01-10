import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import { humanProposalTitle } from "lib/util";
import * as React from "react";
import { Link } from "react-router-dom";
import RewardsString from "components/Proposal/RewardsString";
import { IDAOState, IProposalState, ICompetitionSuggestion } from "@daostack/client";
import { IProfileState } from "reducers/profilesReducer";
import { IRootState } from "reducers";
import { connect } from "react-redux";
import Countdown from "components/Shared/Countdown";
import StatusBlob from "components/Scheme/ContributionRewardExtRewarders/Competition/StatusBlob";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import * as css from "./Competitions.scss";
import { competitionStatus, getProposalSubmissions, ICompetitionStatus } from "./utils";

type ISubscriptionState = Array<ICompetitionSuggestion>;

interface IExternalStateProps {
  creatorProfile: IProfileState;
}

interface IStateProps {
  status: ICompetitionStatus;
}

interface IExternalProps {
  daoState: IDAOState;
  proposalState: IProposalState;
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
    this.state = { 
      status: this.getCompetitionState(),
    };
  }

  private getCompetitionState = (): ICompetitionStatus => {
    const competition = this.props.proposalState.competition;
    const submissions = this.props.data;
    return competitionStatus(competition, submissions);
  }

  private onEndCountdown = () => {
    this.setState({ status: this.getCompetitionState() });
  }

  public render(): RenderOutput {
    const status = this.state.status;

    const {
      creatorProfile,
      daoState,
      proposalState,
    } = this.props;

    const competition = proposalState.competition;
    const submissions = this.props.data;

    return <div className={css.competitionCardContainer} data-test-id={"competition-card-" + proposalState.id}>
      <StatusBlob competition={competition} submissions={submissions}></StatusBlob>
      <div className={css.createByContainer}>
        <div className={css.createdBy}>
          <AccountPopup accountAddress={proposalState.proposer} daoState={daoState}/>
          <AccountProfileName accountAddress={proposalState.proposer} accountProfile={creatorProfile} daoAvatarAddress={daoState.address} detailView={false} />
        </div>
        { status.now.isBefore(status.startTime) ?
          <div className={css.countdown}><div className={css.text}>Submissions open in:</div><Countdown toDate={status.startTime} onEnd={this.onEndCountdown}></Countdown></div> :
          status.now.isBefore(status.votingStartTime) ? 
            <div className={css.countdown}><div className={css.text}>Voting starts in:</div><Countdown toDate={status.votingStartTime} onEnd={this.onEndCountdown}></Countdown></div> :
            (status.now.isBefore(status.endTime) && submissions.length) ?
              <div className={css.countdown}><div className={css.text}>Voting ends in:</div><Countdown toDate={status.endTime} onEnd={this.onEndCountdown}></Countdown></div> : ""
        }
      </div>
      <div className={css.description}>
        <Link className={css.detailLink} to={"/dao/" + daoState.address +  "/crx/proposal/" + proposalState.id} data-test-id="proposal-title">
          <div className={css.name}>{humanProposalTitle(proposalState)}</div>
        </Link>
      </div>
      <div className={css.rewards}>
        <div className={css.transferType}><RewardsString proposal={proposalState} dao={daoState} /></div>
        <img src="/assets/images/Icon/Transfer.svg" />
        <div className={css.winners}>{competition.numberOfWinners} anticipated winners</div>
      </div>
      <div className={css.activityContainer}>
        { /* FAKE -- until we have votes */ }
        <div className={css.suggestions}>{submissions.length} Suggestions | [n] Votes</div>
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
    return getProposalSubmissions(props.proposalState.id, true);
  },
});
