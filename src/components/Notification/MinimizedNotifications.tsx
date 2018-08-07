import * as moment from "moment";
import * as React from "react";
import * as css from "./Notification.scss";
import classNames = require("classnames");
import Util from "lib/util";
import { NotificationStatus, showNotification } from "reducers/notifications";
import Linkify from 'react-linkify';

interface IProps {
    notifications: number;
    unminimize: () => any;
}

export default class Notification extends React.Component<IProps, null> {

  public render() {
    const { notifications, unminimize } = this.props;

    const transactionClass = classNames({
      [css.pendingTransaction]: true,
      [css.clearfix]: true,
      [css.pending]: true,
      [css.minimized]: true,
      [css.notificationMessage]: true,
    });

    return (
      <div style={{cursor: 'pointer'}} className={transactionClass} onClick={() => unminimize()}>
        <div className={css.statusIcon}>
          <b style={{whiteSpace: 'nowrap'}}>{notifications} alert{notifications > 1 ? 's' : ''}</b>
        </div>
      </div>
    );
  }
}
