import * as moment from "moment";
import * as React from "react";
import * as css from "./Notification.scss";
import classNames = require("classnames");

export enum NotificationViewStatus {
  Pending = 'Pending',
  Failure = 'Failure',
  Success = 'Success'
}

interface IProps {
  title: string;
  status: NotificationViewStatus;
  message: string;
  timestamp: number;
  url?: string;
  dismiss: () => any;
}

interface IState {
  minimized: boolean
}

export default class Notification extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = { minimized: false };
  }

  public handleClose(e: any) {
    const { dismiss } = this.props;
    dismiss();
  }

  public handleClick(e: any) {
    const { status } = this.props;
    const { minimized } = this.state;

    if (status === NotificationViewStatus.Pending && minimized) {
      this.setState({minimized: false});
    }
  }

  public render() {
    const { title, message, timestamp, status, url } = this.props;
    const { minimized } = this.state;

    const transactionClass = classNames({
      [css.pendingTransaction]: true,
      [css.clearfix]: true,
      [css.pending]: status === NotificationViewStatus.Pending,
      [css.error]: status === NotificationViewStatus.Failure,
      [css.success]: status === NotificationViewStatus.Success,
      [css.minimized]: status === NotificationViewStatus.Pending && minimized,
    });

    const titleContent =
      url ?
        <a href={url}>{title}</a> :
        title;

    return (
      <div className={transactionClass} onClick={(e) => this.handleClick(e)}>
        <div className={css.statusIcon}>
          <img className={css.pending} src="/assets/images/Icon/Loading-white.svg" />
          <img className={css.success} src="/assets/images/Icon/Success-notification.svg" />
          <img className={css.error} src="/assets/images/Icon/Error-notification.svg" />
        </div>
        <div className={css.transactionMessage}>
          <div className={css.clearfix}>
            <div className={css.left}>
              <span className={css.pending}>{titleContent}</span>
              <span className={css.success}>{titleContent}</span>
              <span className={css.error}>{titleContent}</span>
            </div>
            <div className={css.right}>
              <span className={css.error}>ERROR</span>
            </div>
          </div>
          <div className={css.notificationMessage}>
            {message}
          </div>
        </div>
        <div className={css.notificationControls}>
          <button className={css.pending} onClick={() => this.setState({minimized: true})}><img src="/assets/images/Icon/Minimize-notification.svg" /></button>
          <button className={css.success} onClick={(e) => this.handleClose(e)}><img src="/assets/images/Icon/Close.svg" /></button>
          <button className={css.error} onClick={(e) => this.handleClose(e)}><img src="/assets/images/Icon/Close.svg" /></button>
        </div>
      </div>
    );
  }
}
