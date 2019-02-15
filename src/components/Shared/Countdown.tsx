import * as moment from "moment";
import * as React from 'react';
import * as classNames from "classnames";

import * as css from "./Countdown.scss";

interface IProps {
  detailView?: boolean;
  toDate: Date | moment.Moment;
  fromDate?: Date | moment.Moment;
}

interface IState {
  years: number;
  days: number;
  hours: number;
  min: number;
}

class Countdown extends React.Component<IProps, IState> {
  public interval: any;

  constructor(props: IProps) {
    super(props);

    this.state = this.calculateCountdown(this.props.toDate) || {
      years: 0,
      days: 0,
      hours: 0,
      min: 0
    }
  }

  public componentDidMount() {
    // update every five seconds
    this.interval = setInterval(() => {
      const date = this.calculateCountdown(this.props.toDate);
      date ? this.setState(date) : this.stop();
    }, 5000);
  }

  public componentWillUnmount() {
    this.stop();
  }

  public calculateCountdown(endDate: Date | moment.Moment) {
    let endDateMoment = moment(endDate), now = new Date();

    let diff = endDateMoment.diff(now);

    // clear countdown when date is reached
    if (diff <= 0) {
      return false;
    }

    const duration = moment.duration(diff);
    const timeLeft = {
      years: duration.years(),
      days: duration.days(),
      hours: duration.hours(),
      min: duration.minutes()
    };

    return timeLeft;
  }

  public stop() {
    clearInterval(this.interval);
  }

  public addLeadingZeros(value: string | number) {
    value = String(value);
    while (value.length < 2) {
      value = '0' + value;
    }
    return value;
  }

  public render() {
    const countDown = this.state;

    let percentageComplete = 0;
    if (this.props.fromDate) {
      let endDateMoment = moment(this.props.toDate);
      let timeLeft = endDateMoment.diff(new Date());
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
    });

    return (
      <div className={containerClass}>
        <div className={css.percentageContainer}>
          <div style={{backgroundColor: "blue", height: "2px", width: percentageComplete + "%"}}></div>
        </div>
        {this.props.detailView ? 
            <span>Proposal ends:</span>
          : " "
        }
        <span className={css.timeSection}>
           <strong>{this.addLeadingZeros(countDown.days)}d</strong>
        </span>
        &nbsp;:&nbsp;
        <span className={css.timeSection}>
          <strong>{this.addLeadingZeros(countDown.hours)}h</strong>
        </span>
        &nbsp;:&nbsp;
        <span className={css.timeSection}>
          <strong>{this.addLeadingZeros(countDown.min)}m</strong>
        </span>
      </div>
    );
  }
}

export default Countdown;
