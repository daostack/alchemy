import Countdown from "components/Shared/Countdown";
import { formatFriendlyDateForLocalTimezone } from "lib/util";
import { ICompetitionProposalState } from "@daostack/arc.js";
import * as React from "react";
import { CompetitionStatus, CompetitionStatusEnum } from "./utils";
import * as css from "./Competitions.scss";

export interface IExternalProps {
  status: CompetitionStatus;
  competition: ICompetitionProposalState;
  onEndCountdown: () => void;
}

export default class CountdownText extends React.Component<IExternalProps, null> {

  private onEndCountdown = () => {
    this.props.onEndCountdown();
  }

  public render(): RenderOutput {

    const {status, competition } = this.props;
    const inSubmissions =  status.now.isSameOrAfter(competition.startTime) && status.now.isBefore(competition.suggestionsEndTime);
    const pausedWithSubmissions = status.paused;
    const hasSubmissions = !!competition.totalSuggestions;
    const inVotingWithSubmissions = hasSubmissions && (status.now.isSameOrAfter(competition.votingStartTime) && status.now.isBefore(competition.endTime));
    const hasNotStarted = status.now.isBefore(competition.startTime);
    const endingNoSubmissions = status.status === CompetitionStatusEnum.EndingNoSubmissions;
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
          pausedWithSubmissions ?
            <div className={css.countdown}>
              <div className={css.startsIn}>Voting starts in:</div>
              <Countdown toDate={competition.votingStartTime} onEnd={this.onEndCountdown}/>
            </div> :
            inVotingWithSubmissions ?
              <div className={css.countdown}>
                <div className={css.startsIn}>Voting ends in:</div>
                <Countdown toDate={competition.endTime} onEnd={this.onEndCountdown}/>
              </div> :
              endingNoSubmissions ? <div className={css.countdown}>
                <div className={css.startsIn}>Ending on:</div>
                <div className={css.container}>{formatFriendlyDateForLocalTimezone(competition.endTime)}</div>
              </div> :
                ended ?
                  <div className={css.countdown}>
                    <div className={css.startsIn}>Ended on:</div>
                    <div className={css.container}>{formatFriendlyDateForLocalTimezone(competition.endTime)}</div>
                  </div> :  ""
      }
    </React.Fragment>;
  }
}
