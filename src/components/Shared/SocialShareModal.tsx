import * as React from "react";
// @ts-ignore
import { Modal } from "react-router-modal";
import * as css from "./SocialShareModal.scss";


// interface IState {
//   showSocialSharingModal: boolean;
// }

interface IProps {
  closeHandler: (event: any) => void;
  url: string;
}

export default class SocialShareModal extends React.Component<IProps, null> {

  constructor(props: IProps) {
    super(props);

    // this.state = {
    //   showSocialSharingModal: false,
    // };
  }

  public handleSelectSocialSite(_event: any): void {
    console.log("handling");
  }

  public render() {

    // if (!this.state.showSocialSharingModal) {
    //   return "";
    // }

    return (
      <Modal onBackdropClick={this.props.closeHandler}>
        <div className={css.modalWindow}>
          <div className={css.content}>
            Url: {this.props.url}
            <button onClick={this.props.closeHandler}>Close</button>
          </div>
        </div>
      </Modal>
    );
  }
}
