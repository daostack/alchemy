import * as React from "react";
import { ICompetitionProposalState, ICompetitionSuggestionState } from "@daostack/client";
import Countdown from "components/Shared/Countdown";
import { formatFriendlyDateForLocalTimezone } from "lib/util";
import { CompetitionStatus } from "./utils";
import * as css from "./Competitions.scss";

export interface IExternalProps {
  status: CompetitionStatus;
  competition: ICompetitionProposalState;
  submissions: Array<ICompetitionSuggestionState>;
  onEndCountdown: () => void;
}

export default class CountdownText extends React.Component<IExternalProps, null> {

  private onEndCountdown = () => {
    this.props.onEndCountdown();
  }

  public render(): RenderOutput {

    const {status, competition, submissions} = this.props;
    const inSubmissions =  status.now.isSameOrAfter(competition.startTime) && status.now.isBefore(competition.suggestionsEndTime);
    const inBetweenSubmissionsAndVoting = status.paused;
    const inVoting = status.now.isSameOrAfter(competition.votingStartTime) && status.now.isBefore(competition.endTime);
    const hasNotStarted = status.now.isBefore(competition.startTime);
    const ended = status.now.isSameOrAfter(competition.endTime);

    return <React.Fragment>
      { hasNotStarted ?
        <div className={css.countdown}>
          <div className={css.startsIn}>Submissions start in:</div>
          <Countdown toDate={competition.startTime} onEnd={this.onEndCountdown}/>
        </div> :
        inSubmissions ? 
          <div className={css.countdown}>
            <div className={css.startsIn}>Submissions end in:</div>
            <Countdown toDate={competition.suggestionsEndTime} onEnd={this.onEndCountdown}/>
          </div> :
          (inBetweenSubmissionsAndVoting && submissions.length) ? 
            <div className={css.countdown}>
              <div className={css.startsIn}>Voting starts in:</div>
              <Countdown toDate={competition.votingStartTime} onEnd={this.onEndCountdown}/>
            </div> :
            inVoting ? (submissions.length ?
              <div className={css.countdown}>
                <div className={css.startsIn}>Voting ends in:</div>
                <Countdown toDate={competition.endTime} onEnd={this.onEndCountdown}/>
              </div> :
              <div className={css.countdown}>
                <div className={css.startsIn}>Ending on:</div>
                <div className={css.container}>{formatFriendlyDateForLocalTimezone(competition.endTime)}</div>
              </div>
            ) :
              ended ?
                <div className={css.countdown}>
                  <div className={css.startsIn}>Ended on:</div>
                  <div className={css.container}>{formatFriendlyDateForLocalTimezone(competition.endTime)}</div>
                </div> :  ""
      }
    </React.Fragment>;
  }
}
