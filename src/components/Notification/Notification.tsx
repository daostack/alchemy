import * as moment from "moment";
import * as React from "react";
import * as css from "./Notification.scss";
import { IOperation } from "reducers/operations";

interface IProps {
  operation: IOperation;

  close: () => any;
}

export default class Notification extends React.Component<IProps, null> {
  public handleClose = (e: any) => {
    const {close} = this.props;
    close();
  }

  public render() {
    const { operation } = this.props;
    const { message, status, totalSteps, timestamp, step } = operation;

    return (
      <div className={css.notification}>
        <span className={css.message}>{message}</span>
        <br/>
        <span className={css.message}>status: {status}</span>
        <br/>
        { totalSteps ?
          (totalSteps === 1 ?
            '' :
            <span>step {step} out of {totalSteps}</span>
          ) :
          <span>step {step}</span> }
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
}
