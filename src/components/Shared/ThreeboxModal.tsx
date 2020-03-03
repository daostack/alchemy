import * as React from "react";
import { connect } from "react-redux";
import ModalPopup from "components/shared/ModalPopup";
import { showNotification } from "reducers/notifications";
import * as css from "./ThreeboxModal.scss";

interface IProps {
  action: any;
  closeHandler: (event: any) => void;
  showNotification: typeof showNotification;
}

interface IState {
  dontShowAgain: boolean;
}

const mapDispatchToProps = {
  showNotification,
};

class ThreeboxModal extends React.Component<IProps, IState> {

  public dontShowAgainInput: any;

  constructor(props: IProps) {
    super(props);

    this.state = {
      dontShowAgain: !!parseInt(localStorage.getItem("dontShowThreeboxModal")),
    };
  }

  private handleClickGo = async (e: any): Promise<void> => {
    this.props.action();
    this.props.closeHandler(e);
  }

  private handleClickDontShow = (e: any) => {
    this.setState( { dontShowAgain: e.target.checked });
    localStorage.setItem("dontShowThreeboxModal", e.target.checked ? "1" : "0");
  }

  public render(): RenderOutput {

    return (
      <ModalPopup
        closeHandler={this.props.closeHandler}
        width={510}
        header="Connect"
        body={(
          <div className={css.body}>
            <h1>We&apos;re using 3Box to save your personal data</h1>
            <div className={css.images}>
              <img src="/assets/images/alchemy-logo-blue.svg" />
              <span>+</span>
              <img src="/assets/images/narwhal-blue.svg" />
            </div>
            <div>
              You&apos;ll need you to sign two messages to allow us to save the data in your 3Box account.
              Expect to wait several seconds between each signature.
              Afterwards you won&apos;t need to sign more messages during this session.
            </div>
          </div>
        )}
        footer={(
          <div className={css.footer}>
            <span><input type="checkbox" onChange={this.handleClickDontShow} value="1" checked={this.state.dontShowAgain} />Don&apos;t show this again</span>
            <button className={css.cancelButton} onClick={this.props.closeHandler}>
              Cancel
            </button>
            <button onClick={this.handleClickGo} data-test-id="go-threebox">
              Got it
            </button>
          </div>
        )}
      />
    );
  }
}

export default connect(null, mapDispatchToProps)(ThreeboxModal);
