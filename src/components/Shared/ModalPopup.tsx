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

  public render(): RenderOutput {
    const { body, footer, header } = this.props;

    return (
      <Modal>
        <div className={css.modalWindow}>
          <div className={css.header}>{header}</div>
          <div className={css.body}>{body}</div>
          {footer ? <div className={css.footer}>{footer}</div> : ""}
        </div>
      </Modal>
    );
  }
}
