import { IProposalOutcome, IProposalStage, IProposalState } from "@dorgtech/arc.js";
import * as classNames from "classnames";
import * as moment from "moment";
import * as React from "react";
import { closingTime } from "lib/proposalHelpers";

import * as css from "./Countdown.scss";

interface IProps {
  detailView?: boolean;
  proposalState: IProposalState;
  pluginView?: boolean;
  onEnd?(): any;
}

interface IState {
  years: number;
  days: number;
  hours: number;
  min: number;
  seconds: number;
  complete: boolean;
}

export default class ProposalCountdown extends React.Component<IProps, IState> {
  public interval: any;

  constructor(props: IProps) {
    super(props);

    this.state = this.calculateCountdown(closingTime(this.props.proposalState));
  }

  public componentDidMount() {
    // update every five seconds
    this.interval = setInterval(() => {
      const countdownState = this.calculateCountdown(closingTime(this.props.proposalState));
      this.setState(countdownState);

      if (countdownState.complete) {
        this.stop();
        if (this.props.onEnd) {
          this.props.onEnd();
        }
      }
    }, 1000);
  }

  public componentWillUnmount() {
    this.stop();
  }

  public calculateCountdown(endDate: Date | moment.Moment) {
    const endDateMoment = moment(endDate);
    const now = new Date();

    const diff = endDateMoment.diff(now);

    // clear countdown when date is reached
    if (diff <= 0) {
      return {
        years: 0,
        days: 0,
        hours: 0,
        min: 0,
        seconds: 0,
        complete: true,
      };
    }

    const duration = moment.duration(diff);
    const timeLeft = {
      years: duration.years(),
      days: duration.days(),
      hours: duration.hours(),
      min: duration.minutes(),
      seconds: duration.seconds(),
      complete: false,
    };

    return timeLeft;
  }

  public stop() {
    clearInterval(this.interval);
  }

  public addLeadingZeros(value: string | number) {
    value = String(value);
    while (value.length < 2) {
      value = "0" + value;
    }
    return value;
  }

  public render(): RenderOutput {
    const countDown = this.state;
    const { proposalState } = this.props;

    const percentageComplete = 0;
    // TODO: do we want to show the percentage complete bar? We have not been so far
    // if (this.props.fromDate) {
    //   const endDateMoment = moment(this.props.toDate);
    //   const timeLeft = endDateMoment.diff(new Date());
    //   if (timeLeft <= 0) {
    //     percentageComplete = 100;
    //   } else {
    //     percentageComplete = (1 - timeLeft / endDateMoment.diff(this.props.fromDate)) * 100;
    //   }

    //   if (percentageComplete < 1) {
    //     percentageComplete = 2;
    //   }
    // }

    const containerClass = classNames({
      [css.detailView]: this.props.detailView,
      [css.container]: true,
      [css.pluginView]: this.props.pluginView,
    });

    return (
      <div className={containerClass}>
        <div className={css.percentageContainer}>
          <div style={{ backgroundColor: "blue", height: "2px", width: percentageComplete + "%" }}></div>
        </div>
        {this.props.detailView ?
          <span className={css.label}>
            { proposalState.stage === IProposalStage.Queued ? "Proposal will expire in" :
              proposalState.stage === IProposalStage.PreBoosted && proposalState.downStakeNeededToQueue.lten(0) ? "Proposal will un-boost in" :
                proposalState.stage === IProposalStage.PreBoosted ? "Proposal will boost in" :
                  (proposalState.stage === IProposalStage.Boosted || proposalState.stage === IProposalStage.QuietEndingPeriod) && proposalState.winningOutcome === IProposalOutcome.Pass ? "Proposal will pass in" :
                    (proposalState.stage === IProposalStage.Boosted || proposalState.stage === IProposalStage.QuietEndingPeriod) ? "Proposal will fail in" :
                      ""
            }
          </span>
          : " "
        }
        {
          countDown.days ? <span className={css.timeSection}><strong>{this.addLeadingZeros(countDown.days)}d</strong><span className={css.colon}>:</span></span> : ""
        }
        <span className={css.timeSection}><strong>{this.addLeadingZeros(countDown.hours)}h</strong><span className={css.colon}>:</span></span>
        <span className={css.timeSection}><strong>{this.addLeadingZeros(countDown.min)}m</strong></span>
        {
          countDown.days ? "" : <span className={css.timeSection}><span className={css.colon}>:</span><strong>{this.addLeadingZeros(countDown.seconds)}s</strong></span>
        }
        {proposalState.stage === IProposalStage.QuietEndingPeriod && !countDown.complete ?
          <strong className={css.overTime}>
            <img src="/assets/images/Icon/Overtime.svg" /> OVERTIME
          </strong>
          : " "
        }
      </div>
    );
  }
}
