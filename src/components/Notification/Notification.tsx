import * as moment from "moment";
import * as React from "react";
import * as css from "./Notification.scss";

interface Props {
  id: number;
  message: string;
  timestamp: Date;

  close: () => any;
}

export default class Notification extends React.Component<Props, null> {
  public render() {
    const {id, message, timestamp} = this.props;
    return (
      <div className={css.notification}>
        <span className={css.message}>{message}</span>
        <br/>
        <small className={css.timestamp}>{moment(timestamp).fromNow()}</small>
        <img
          src="/assets/images/Icon/Close.svg"
          alt="close"
          className={css.close}
          onClick={this.handleClose}/>
      </div>
    );
  }

  public handleClose = (e: any) => {
    const {close} = this.props;
    close();
  }
}
