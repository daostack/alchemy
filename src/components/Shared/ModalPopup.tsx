import * as React from "react";
import { Modal } from "react-router-modal";
import * as css from "./ModalPopup.scss";

interface IProps {
  closeHandler: (event: any) => void;
  body: any;
  footer?: any;
  header: any;
  width?: number | string;
}

export default class ModalPopup extends React.Component<IProps, null> {

  public componentDidMount(): void {
    document.addEventListener("keydown", this.handleKeyPress, false);
  }

  public componentWillUnmount(): void {
    document.removeEventListener("keydown", this.handleKeyPress, false);
  }

  private handleKeyPress = (e: any) => {
    // Close modal on ESC key press
    if (e.keyCode === 27) {
      this.props.closeHandler(e);
    }
  }

  public render(): RenderOutput {
    const { closeHandler, body, footer, header, width } = this.props;

    return (
      <Modal onBackdropClick={closeHandler}>
        <div className={css.modalWindow} style={{ width: width ?? "60%" }} >
          <div className={css.header}>{header}</div>
          <div className={css.body}>{body}</div>
          {footer ? <div className={css.footer}>{footer}</div> : ""}
        </div>
      </Modal>
    );
  }
}
