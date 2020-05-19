import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import { humanProposalTitle } from "lib/util";
import RewardsString from "components/Proposal/RewardsString";
import { IProfileState } from "reducers/profilesReducer";
import { IRootState } from "reducers";
import CountdownText from "components/Plugin/ContributionRewardExtRewarders/Competition/CountdownText";
import { connect } from "react-redux";
import { IDAOState, ICompetitionProposalState } from "@daostack/arc.js";
import { Link } from "react-router-dom";
import * as React from "react";
import { competitionStatus, CompetitionStatus } from "./utils";
import * as css from "./Competitions.scss";
import StatusBlob from "./StatusBlob";

interface IExternalStateProps {
  creatorProfile: IProfileState;
}

interface IStateProps {
  status: CompetitionStatus;
}

interface IExternalProps {
  daoState: IDAOState;
  proposalState: ICompetitionProposalState;
  handleStatusChange: (proposal: ICompetitionProposalState, newStatus: CompetitionStatus) => void;
}

type IProps = IExternalProps & IExternalStateProps;

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
    const competition = this.props.proposalState;
    return competitionStatus(competition);
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

    const competition = proposalState;
    const numSubmissions = competition.totalSuggestions;
    const numVotes = competition.totalVotes;
    const numWinningSubmissions = competition.numberOfWinningSuggestions;
    const overWithWinners = status.overWithWinners;

    return <div className={css.competitionCardContainer} data-test-id={"competition-card-" + proposalState.id}>
      <StatusBlob competition={competition}></StatusBlob>
      <div className={css.createByContainer}>
        <div className={css.createdBy}>
          <AccountPopup accountAddress={proposalState.proposer} daoState={daoState}/>
          <AccountProfileName accountAddress={proposalState.proposer} accountProfile={creatorProfile} daoAvatarAddress={daoState.address} detailView={false} />
        </div>
        <div className={css.countdown}>
          <CountdownText status={status} competition={competition} onEndCountdown={this.onEndCountdown}></CountdownText>
        </div>
      </div>
      <div className={css.description}>
        <Link className={css.detailLink} to={"/dao/" + daoState.address + "/crx/proposal/" + proposalState.id} data-test-id="proposal-title">
          <div className={css.name}>{humanProposalTitle(proposalState)}</div>
        </Link>
      </div>
      <div className={css.rewards}>
        <div className={css.winnerIcon}>
          { overWithWinners ? <img src="/assets/images/Icon/winner.svg"></img> : "" }
        </div>
        <div className={css.transferType}><RewardsString proposalState={proposalState} daoState={daoState} /></div>
        <img src="/assets/images/Icon/Transfer.svg" />
        { overWithWinners ?
          <div className={css.winners}>{numWinningSubmissions} winners</div> :
          <div className={css.winners}>{competition.numberOfWinners} anticipated winners</div>
        }
      </div>
      <div className={css.activityContainer}>
        <div className={css.suggestions}>{numSubmissions} Submissions | {numVotes} Votes</div>
        <div className={css.comments}></div>
      </div>
    </div>;
  }
}

export default connect(mapStateToProps)(CompetitionCard);
