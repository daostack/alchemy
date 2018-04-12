import * as moment from "moment";
import * as React from "react";
import * as css from "./Notification.scss";
import { IOperation, OperationsStatus } from "reducers/operations";
import classNames = require("classnames");

interface IProps {
  operation: IOperation;

  close: () => any;
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
    const { close } = this.props;
    close();
  }

  public handleClick(e: any) {
    const { operation } = this.props;
    const { status } = operation;
    const { minimized } = this.state;

    if (status === OperationsStatus.Pending && minimized) {
      this.setState({minimized: false});
    }
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

    const stepInfo = <span>{totalSteps !== 1 ? `Step ${step}` : ''} {totalSteps && totalSteps !== 1 ? `OF ${totalSteps}` : ''}</span>;

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
              <span className={css.pending}>PENDING TRANSACTION</span>
              <span className={css.success}>TRANSACTION SUCCESSFUL</span>
              <span className={css.error}>TRANSACTION FAILED</span>
            </div>
            <div className={css.right}>
              <span className={css.pending}>{stepInfo}</span>
              <span className={css.success}>{stepInfo}</span>
              <span className={css.error}>ERROR</span>
            </div>
          </div>
          <div className={css.notificationMessage}>
            <span>{message}</span>
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
