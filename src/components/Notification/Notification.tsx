import classNames = require("classnames");
import { copyToClipboard } from "lib/util";
import * as React from "react";
import Linkify from "react-linkify";
import { NotificationStatus, showNotification } from "reducers/notifications";
import * as css from "./Notification.scss";

export enum NotificationViewStatus {
  Pending = "Pending",
  Failure = "Failure",
  Success = "Success"
}

interface IProps {
  title: string;
  status: NotificationViewStatus;
  message: string;
  fullErrorMessage?: string;
  timestamp: number;
  url?: string;
  dismiss: () => any;
  minimize: () => any;
  showNotification: typeof showNotification;
}

export default class Notification extends React.Component<IProps, null> {
  constructor(props: IProps) {
    super(props);
  }

  public handleClose(e: any) {
    const { dismiss, status } = this.props;
    if (status === NotificationViewStatus.Pending) {
      if (confirm("Often transactions get approved after 24h, closing this will prevent you from following the status of the tx, are you sure you would like to close this?")) {
        dismiss();
      }
    } else {
      dismiss();
    }

  }

  public copyToClipboard(message: string) {
    const { showNotification } = this.props;
    copyToClipboard(message);
    showNotification(NotificationStatus.Success, "Copied to clipboard!");
  }

  public render() {
    const { title, message, status, url, fullErrorMessage, minimize } = this.props;

    const transactionClass = classNames({
      [css.pendingTransaction]: true,
      clearfix: true,
      [css.pending]: status === NotificationViewStatus.Pending,
      [css.error]: status === NotificationViewStatus.Failure,
      [css.success]: status === NotificationViewStatus.Success,
    });

    return (
      <div className={transactionClass}>
        <div className={css.statusIcon}>
          <img className={css.pending} src="/assets/images/Icon/Loading-white.svg" />
          <img className={css.success} src="/assets/images/Icon/Success-notification.svg" />
          <img className={css.error} src="/assets/images/Icon/Error-notification.svg" />
        </div>
        <div className={css.transactionMessage}>
          <div className="clearfix">
            <div className={css.left}>
              <span className={css.pending}>{title}</span>
              <span className={css.success}>{title}</span>
              <span className={css.error}>{title}</span>
            </div>
            <div className={css.right}>
              <span className={css.error}>ERROR</span>
            </div>
          </div>
          <div className={css.notificationMessage}>
            <Linkify>{message}</Linkify>
            {
              fullErrorMessage ?
                <span style={{cursor: "pointer"}} onClick={() => this.copyToClipboard(fullErrorMessage)}>&nbsp;(copy full error)</span>
                : ""
            }
            {
              url ?
                <span><br/><a href={url} target="_blank" rel="noopener noreferrer">See in etherscan</a></span>
                : ""
            }
          </div>
        </div>
        <div className={css.notificationControls}>
          <button className={css.pending} onClick={() => minimize()}><img style={{width: "18px", height: "18px"}} src="/assets/images/Icon/Minimize-notification.svg" /></button>
          <button className={css.pending} onClick={(e) => this.handleClose(e)} data-test-id="button-notification-close"><img src="/assets/images/Icon/Close.svg" /></button>
          <button className={css.success} onClick={(e) => this.handleClose(e)}  data-test-id="button-notification-close"><img src="/assets/images/Icon/Close.svg" /></button>
          <button className={css.error} onClick={(e) => this.handleClose(e)}  data-test-id="button-notification-close"><img src="/assets/images/Icon/Close.svg" /></button>
        </div>
      </div>
    );
  }
}
