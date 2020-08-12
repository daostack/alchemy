import * as moment from "moment";
import * as React from "react";

import * as css from "./Countdown.scss";
import { calculateCountdown } from "lib/util";

interface IProps {
  toDate: Date | moment.Moment;
  fromDate?: Date | moment.Moment;
  onEnd?(): any;
}

interface IState {
  days: number;
  hours: number;
  min: number;
  seconds: number;
}

export default class Countdown extends React.Component<IProps, IState> {
  public interval: any;

  constructor(props: IProps) {
    super(props);

    this.state = calculateCountdown(this.props.toDate);
  }

  public componentDidMount(): void {
    this.setInterval();
  }

  public setInterval(): void {
    if (!this.interval) {

      // update every five seconds
      this.interval = setInterval(() => {
        const countdown = calculateCountdown(this.props.toDate);
        if (!countdown.complete) {
          this.setState(countdown);
        } else {
          this.stop();
          if (this.props.onEnd) {
            this.props.onEnd();
          }
        }
      }, 1000);
    }
  }

  public componentWillUnmount(): void {
    this.stop();
  }

  public stop(): void {
    clearInterval(this.interval);
    this.interval = 0;
  }

  public addLeadingZeros(value: string | number): string {
    value = String(value);
    while (value.length < 2) {
      value = "0" + value;
    }
    return value;
  }

  public render(): RenderOutput {

    // handle case where fromDate has being reset and need to restart the countdown
    this.setInterval();

    const countDown = this.state;

    let percentageComplete = 0;
    if (this.props.fromDate) {
      const endDateMoment = moment(this.props.toDate);
      const timeLeft = endDateMoment.diff(new Date());
      if (timeLeft <= 0) {
        percentageComplete = 100;
      } else {
        percentageComplete = (1 - timeLeft / endDateMoment.diff(this.props.fromDate)) * 100;
      }

      if (percentageComplete < 1) {
        percentageComplete = 2;
      }
    }

    return (
      <div className={css.container}>
        <div className={css.percentageContainer}>
          <div style={{ backgroundColor: "blue", height: "2px", width: percentageComplete + "%" }}></div>
        </div>
        {
          countDown.days ? <span className={css.timeSection}><strong>{this.addLeadingZeros(countDown.days)}d</strong><span className={css.colon}>:</span></span> : ""
        }
        <span className={css.timeSection}><strong>{this.addLeadingZeros(countDown.hours)}h</strong><span className={css.colon}>:</span></span>
        <span className={css.timeSection}><strong>{this.addLeadingZeros(countDown.min)}m</strong></span>
        {
          countDown.days ? "" : <span className={css.timeSection}><span className={css.colon}>:</span><strong>{this.addLeadingZeros(countDown.seconds)}s</strong></span>
        }
      </div>
    );
  }
}
