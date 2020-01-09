import classNames = require("classnames");
import * as React from "react";
import * as css from "./Notification.scss";

interface IProps {
  notifications: number;
  unminimize: () => any;
}

export default class Notification extends React.Component<IProps, null> {

  private unmimimize = () => { this.props.unminimize(); };

  public render(): RenderOutput {
    const { notifications } = this.props;

    const transactionClass = classNames({
      [css.pendingTransaction]: true,
      clearfix: true,
      [css.pending]: true,
      [css.minimized]: true,
      [css.notificationMessage]: true,
    });

    return (
      <div style={{cursor: "pointer"}} className={transactionClass} onClick={this.unmimimize}>
        <div className={css.statusIcon}>
          <b style={{whiteSpace: "nowrap"}}>{notifications} alert{notifications > 1 ? "s" : ""}</b>
        </div>
      </div>
    );
  }
}
