import * as moment from "moment";
import * as React from "react";
import * as css from "./Notification.scss";
import { IOperation, OperationsStatus } from "reducers/operations";
import classNames = require("classnames");

interface IProps {
  operation: IOperation;

  close: () => any;
}

export default class Notification extends React.Component<IProps, { minimized: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { minimized: false };
  }

  public handleClose = (e: any) => {
    const { close } = this.props;
    close();
  }

  public render() {
    const { operation } = this.props;
    const { message, status, totalSteps, timestamp, step } = operation;
    const { minimized } = this.state;

    const transactionClass = classNames({
      [css.pendingTransaction]: true,
      [css.clearfix]: true,
      [css.pending]: status === OperationsStatus.Pending,
      [css.error]: status === OperationsStatus.Failure,
      [css.success]: status === OperationsStatus.Success,
      [css.minimized]: status === OperationsStatus.Pending && minimized,
    });

    return (
      <div className={transactionClass} onClick={() => status === OperationsStatus.Pending && minimized ? this.setState({minimized: false}) : null }>
        <div className={css.statusIcon}>
          <img className={css.pending} src="/assets/images/Icon/Loading-white.svg" />
          <img className={css.success} src="/assets/images/Icon/Success-notification.svg" />
          <img className={css.error} src="/assets/images/Icon/Error-notification.svg" />
        </div>
        <div className={css.transactionMessage}>
          <div className={css.clearfix}>
            <div className={css.left}>
              <span className={css.pending}>PENDING TRANSACTION</span>
              <span className={css.success}>TRANSACTION SUCCESSFUL</span>
              <span className={css.error}>TRANSACTION FAILED</span>
            </div>
            <div className={css.right}>
              <span className={css.pending}>{totalSteps !== 1 ? `Step ${step}` : ''} {totalSteps && totalSteps !== 1 ? `OF ${totalSteps}` : ''}</span>
              <span className={css.success}>{totalSteps !== 1 ? `Step ${step}` : ''} {totalSteps && totalSteps !== 1 ? `OF ${totalSteps}` : ''}</span>
              <span className={css.error}>ERROR</span>
            </div>
          </div>
          <div className={css.notificationMessage}>
            <span>{message}</span>
          </div>
        </div>
        <div className={css.notificationControls}>
          <button className={css.pending} onClick={() => this.setState({minimized: true})}><img src="/assets/images/Icon/Minimize-notification.svg" /></button>
          <button className={css.success} onClick={this.handleClose}><img src="/assets/images/Icon/Close.svg" /></button>
          <button className={css.error} onClick={this.handleClose}><img src="/assets/images/Icon/Close.svg" /></button>
        </div>
      </div>
    );
  }
}
