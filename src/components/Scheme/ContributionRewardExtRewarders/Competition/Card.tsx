import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import { humanProposalTitle } from "lib/util";
import * as React from "react";
import { Link } from "react-router-dom";
import RewardsString from "components/Proposal/RewardsString";
import { IDAOState, IProposalState } from "@daostack/client";
import { IProfileState } from "reducers/profilesReducer";
import { IRootState } from "reducers";
import { connect } from "react-redux";
import classNames from "classnames";
import Countdown from "components/Shared/Countdown";
import * as css from "./Competitions.scss";

import moment = require("moment");

interface IStateProps {
  creatorProfile: IProfileState;
}

interface IExternalProps {
  daoState: IDAOState;
  proposalState: IProposalState;
}

type IProps = IExternalProps & IStateProps;

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
    const now = moment();
    const startTime = moment(competition.startTime);
    const votingStartTime = moment(competition.votingStartTime);
    const endTime = moment(competition.endTime);

    return <div className={css.competitionCardContainer} data-test-id={"competition-card-" + proposalState.id}>
      { now.isBefore(startTime) ?
        <div className={css.status}>Not open yet</div> :
        now.isBefore(votingStartTime) ? 
          <div className={classNames({[css.status]: true, [css.open]: true})}>Open for suggestions</div> :
          now.isBefore(endTime) ?
            <div className={classNames({[css.status]: true, [css.voting]: true})}>Voting started!</div> : ""
      }
      <div className={css.createByContainer}>
        <div className={css.createdBy}>
          <AccountPopup accountAddress={proposalState.proposer} daoState={daoState}/>
          <AccountProfileName accountAddress={proposalState.proposer} accountProfile={creatorProfile} daoAvatarAddress={daoState.address} detailView={false} />
        </div>
        { now.isBefore(startTime) ?
          <div className={css.countdown}>Suggestions open in <Countdown fromDate={now} toDate={startTime}></Countdown></div> :
          now.isBefore(votingStartTime) ? 
            <div className={css.countdown}>Voting starts in <Countdown fromDate={now} toDate={votingStartTime}></Countdown></div> :
            now.isBefore(endTime) ?
              <div className={css.countdown}>Voting ends in <Countdown fromDate={now} toDate={endTime}></Countdown></div> : ""
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
        <div className={css.winners}>{competition.numberOfWinners} winners</div>
      </div>
      <div className={css.activityContainer}>
        <div className={css.suggestions}>21 Suggestions | 3 Votes</div>
        <div className={css.comments}></div>
      </div>
    </div>;
  }
}

export default connect(mapStateToProps)(CompetitionCard);
