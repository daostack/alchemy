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
import { competitionStatus, getProposalSubmissions } from "./utils";

type ISubscriptionState = Array<ICompetitionSuggestion>;

interface IStateProps {
  creatorProfile: IProfileState;
}

interface IExternalProps {
  daoState: IDAOState;
  proposalState: IProposalState;
}

type IProps = IExternalProps & IStateProps & ISubscriptionProps<ISubscriptionState>;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {

  return {
    ...ownProps,
    creatorProfile: state.profiles[ownProps.proposalState.proposer],
  };
};

class CompetitionCard extends React.Component<IProps, null> {

  public render(): RenderOutput {

    const {
      creatorProfile,
      daoState,
      proposalState,
    } = this.props;

    const competition = proposalState.competition;
    const submissions = this.props.data;
    const status = competitionStatus(competition, submissions);

    return <div className={css.competitionCardContainer} data-test-id={"competition-card-" + proposalState.id}>
      <StatusBlob competition={competition} submissions={submissions}></StatusBlob>
      <div className={css.createByContainer}>
        <div className={css.createdBy}>
          <AccountPopup accountAddress={proposalState.proposer} daoState={daoState}/>
          <AccountProfileName accountAddress={proposalState.proposer} accountProfile={creatorProfile} daoAvatarAddress={daoState.address} detailView={false} />
        </div>
        { status.now.isBefore(status.startTime) ?
          <div className={css.countdown}>Suggestions open in <Countdown toDate={status.startTime}></Countdown></div> :
          status.now.isBefore(status.votingStartTime) ? 
            <div className={css.countdown}>Voting starts in <Countdown toDate={status.votingStartTime}></Countdown></div> :
            (status.now.isBefore(status.endTime) && submissions.length) ?
              <div className={css.countdown}><div className={css.text}>Voting ends in</div><Countdown toDate={status.endTime}></Countdown></div> : ""
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
