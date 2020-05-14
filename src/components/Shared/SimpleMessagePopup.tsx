import ModalPopup from "./ModalPopup";
import * as React from "react";
import * as css from "./SimpleMessagePopup.scss";

interface IState {
  showing: boolean;
}

export enum EnumButtonSpec {
  Ok = 1,
  // eventually will turn this into a confirmation modal, adding OkCancel, Yes/No and stuff
}

interface IExternalProps {
  closeHandler?: (event: any) => void;
  body: string | JSX.Element;
  buttonSpec?: EnumButtonSpec;
  title?: string | JSX.Element;
}

export default class SimpleMessagePopup extends React.Component<IExternalProps, IState> {

  constructor(props: IExternalProps) {
    super(props);

    this.state = {
      showing: false,
    };
  }

  private closeHandler = (event: any) => {
    this.setState({ showing: false });
    if (this.props.closeHandler) {
      this.props.closeHandler(event);
    }
  }

  private renderButtons = (): JSX.Element => {
    const okButton = (<button className={css.closeButton} onClick={this.closeHandler}>OK</button>);
    switch (this.props.buttonSpec) {
      case EnumButtonSpec.Ok:
      default:
        return okButton;
    }
  }

  public show() {
    this.setState({ showing: true });
  }

  public render(): RenderOutput {

    if (!this.state.showing) {
      return "";
    }

    if (!this.props.body) {
      throw new Error(`message body is required`);
    }

    return (
      <div className={css.modalContainer}>
        <ModalPopup
          closeHandler={this.closeHandler}
          header={
            <div className={css.modalHeader}>
              <div className={css.title}>{this.props.title ?? "Alchemy"}</div>
              <div className={css.closeButtonX} onClick={this.closeHandler}><img src={"/assets/images/Icon/close-grey.svg"} />
              </div>
            </div>
          }
          body={
            <div className={css.modalBody}>{this.props.body}</div>
          }
          footer={
            <div className={css.modalFooter}>{this.renderButtons()}</div>
          }
        />
      </div>
    );
  }
}
