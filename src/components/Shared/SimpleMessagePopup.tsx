import * as uiActions from "@store/ui/uiActions";
import ModalPopup from "./ModalPopup";
import * as React from "react";
import * as css from "./SimpleMessagePopup.scss";
import { connect } from "react-redux";
import { IRootState } from "@store";

interface IDispatchProps {
  hideSimpleMessage: typeof uiActions.hideSimpleMessage;
}

const mapDispatchToProps = {
  hideSimpleMessage: uiActions.hideSimpleMessage,
};

export enum EnumButtonSpec {
  Ok = 1,
  // eventually will turn this into a confirmation modal, adding OkCancel, Yes/No and stuff
}

export interface ISimpleMessagePopupProps {
  closeHandler?: (event: any) => void;
  body: string | JSX.Element;
  buttonSpec?: EnumButtonSpec;
  /**
   * `buttonSpec` is ignored if `hideFooter` is true
   */
  hideFooter?: boolean;
  title?: string | JSX.Element;
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

  private closeHandler = (event: any) => {
    this.props.hideSimpleMessage();
    if (this.props.options.closeHandler) {
      this.props.options.closeHandler(event);
    }
  }

  private renderButtons = (): JSX.Element => {
    const okButton = (<button className={css.closeButton} onClick={this.closeHandler}>OK</button>);
    switch (this.props.options.buttonSpec) {
      case EnumButtonSpec.Ok:
      default:
        return okButton;
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
      <div className={css.modalContainer}>
        <ModalPopup
          closeHandler={this.closeHandler}
          header={
            <div className={css.modalHeader}>
              <div className={css.title}>{this.props.options.title ?? "Alchemy"}</div>
              <div className={css.closeButtonX} onClick={this.closeHandler}><img src={"/assets/images/Icon/close-grey.svg"} />
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
        />
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SimpleMessagePopup);
