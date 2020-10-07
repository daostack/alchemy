import * as uiActions from "actions/uiActions";
import ModalPopup from "./ModalPopup";
import * as React from "react";
import * as css from "./SimpleMessagePopup.scss";
import { connect } from "react-redux";
import { IRootState } from "reducers";

interface IDispatchProps {
  hideSimpleMessage: typeof uiActions.hideSimpleMessage;
}

const mapDispatchToProps = {
  hideSimpleMessage: uiActions.hideSimpleMessage,
};

export enum EnumButtonSpec {
  OK = 1,
  YesNo = 2,
}

export interface ISimpleMessagePopupProps {
  /**
   * Invoked for "Yes" and "OK", but not for "No", ESC, or other way of closing the popup.
   */
  submitHandler?: (event: any) => void;
  body: string | JSX.Element;
  buttonSpec?: EnumButtonSpec;
  /**
   * `buttonSpec` is ignored if `hideFooter` is true
   */
  hideFooter?: boolean;
  title?: string | JSX.Element;
  width?: string;
}

interface IStateProps {
  options: ISimpleMessagePopupProps;
  showing: boolean;
}

const mapStateToProps = (state: IRootState): IStateProps => {
  return {
    options: state.ui.simpleMessageOptions,
    showing: state.ui.simpleMessageOpen,
  };
};

class SimpleMessagePopup extends React.Component<IDispatchProps & IStateProps, null> {

  private submitHandler = (event: any) => {
    this.props.hideSimpleMessage();
    this.props.options.submitHandler?.(event);
  }

  private renderButtons = (): JSX.Element => {
    switch (this.props.options.buttonSpec) {
      case EnumButtonSpec.YesNo:
        return (
          <><button className={css.noButton} autoFocus onClick={this.props.hideSimpleMessage}>No</button>
            <button className={css.yesButton} onClick={this.submitHandler}>Yes</button></>
        );
      case EnumButtonSpec.OK:
      default:
        return (<button className={css.closeButton} onClick={this.submitHandler}>OK</button>);
    }
  }

  public render(): RenderOutput {

    if (!this.props.showing) {
      return "";
    }

    if (!this.props.options.body) {
      throw new Error("message body is required");
    }

    return (
      <>
        <ModalPopup
          closeHandler={this.props.hideSimpleMessage}
          header={
            <div className={css.modalHeader}>
              <div className={css.title}>{this.props.options.title ?? "Alchemy"}</div>
              <div className={css.closeButtonX} onClick={this.props.hideSimpleMessage}><img src={"/assets/images/Icon/close-grey.svg"} />
              </div>
            </div>
          }
          body={
            <div className={css.modalBody}>{this.props.options.body}</div>
          }
          footer={
            this.props.options.hideFooter ? undefined :
              <div className={css.modalFooter}>{this.renderButtons()}</div>
          }
          width={this.props.options.width}
        />
      </>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SimpleMessagePopup);
