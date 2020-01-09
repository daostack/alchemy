import * as classNames from "classnames";
import * as moment from "moment";
import * as React from "react";

import * as css from "./Countdown.scss";

interface IProps {
  detailView?: boolean;
  toDate: Date | moment.Moment;
  fromDate?: Date | moment.Moment;
  overTime?: boolean;
  schemeView?: boolean;
  onEnd?(): any;
}

interface IState {
  years: number;
  days: number;
  hours: number;
  min: number;
  seconds: number;
}

class Countdown extends React.Component<IProps, IState> {
  public interval: any;

  constructor(props: IProps) {
    super(props);

    this.state = this.calculateCountdown(this.props.toDate) || {
      years: 0,
      days: 0,
      hours: 0,
      min: 0,
      seconds: 0,
    };
  }

  public componentDidMount() {
    this.setInterval();
  }
  
  public setInterval() {
    if (!this.interval) {

      // update every five seconds
      this.interval = setInterval(() => {
        const date = this.calculateCountdown(this.props.toDate);
        if (date) {
          this.setState(date);
        } else {
          this.stop();
          if (this.props.onEnd) {
            this.props.onEnd();
          }
        }
      }, 1000);
    }
  }

  public componentWillUnmount() {
    this.stop();
  }

  public calculateCountdown(endDate: Date | moment.Moment): IState {
    const endDateMoment = moment(endDate); const now = new Date();

    const diff = endDateMoment.diff(now);

    // clear countdown when date is reached
    if (diff <= 0) {
      return null;
    }

    const duration = moment.duration(diff);
    const timeLeft = {
      years: duration.years(),
      days: duration.days(),
      hours: duration.hours(),
      min: duration.minutes(),
      seconds: duration.seconds(),
    };

    return timeLeft;
  }

  public stop() {
    clearInterval(this.interval);
    this.interval = 0;
  }

  public addLeadingZeros(value: string | number) {
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

    const containerClass = classNames({
      [css.detailView]: this.props.detailView,
      [css.container]: true,
      [css.schemeView]: this.props.schemeView,
    });

    return (
      <div className={containerClass}>
        <div className={css.percentageContainer}>
          <div style={{ backgroundColor: "blue", height: "2px", width: percentageComplete + "%" }}></div>
        </div>
        {this.props.detailView ?
          <span className={css.label}>Proposal ends:</span>
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
        {this.props.overTime ?
          <strong className={css.overTime}>
            <img src="/assets/images/Icon/Overtime.svg" /> OVERTIME
          </strong>
          : " "
        }
      </div>
    );
  }
}

export default Countdown;
