import ModalPopup from "components/Shared/ModalPopup";
import { copyToClipboard } from "lib/util";
import * as React from "react";
import Tooltip from "rc-tooltip";
import * as css from "./SocialShareModal.scss";

interface IState {
  showCopiedFeedback: boolean;
}

interface IProps {
  closeHandler: (event: any) => void;
  url: string;
}

export default class SocialShareModal extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);

    this.selectTwitter = this.selectTwitter.bind(this);
    this.selectReddit = this.selectReddit.bind(this);
    this.selectFacebook = this.selectFacebook.bind(this);
    this.selectTelegram = this.selectTelegram.bind(this);
    this.copyUrl = this.copyUrl.bind(this);

    this.state = {
      showCopiedFeedback: false,
    };
  }

  private showCopiedFeedback(): void {
    this.setState({ showCopiedFeedback: true });
    setTimeout(() => this.hideCopiedFeedback(), 5000);
  }

  private hideCopiedFeedback(): void {
    this.setState({ showCopiedFeedback: false });
  }

  private sharingMsgTwitter = "Check%20out%20this%20proposal%20in%20@DAOstack%20Alchemy!";
  private sharingMsg = "Check%20out%20this%20proposal%20in%20DAOstack%20Alchemy!";

  private selectTwitter(_event: any): void {
    const sharingUrl = `https://twitter.com/intent/tweet/?text=${this.sharingMsgTwitter}&url=${this.props.url}`;
    window.open(sharingUrl, "_blank");
  }
  private selectReddit(_event: any): void {
    const sharingUrl = `https://reddit.com/submit/?url=${this.props.url}&resubmit=true&title=${this.sharingMsg}`;
    window.open(sharingUrl, "_blank");
  }
  private selectFacebook(_event: any): void {
    const sharingUrl = `https://facebook.com/sharer/sharer.php?u=${this.props.url}`;
    window.open(sharingUrl, "_blank");
  }
  private selectTelegram(_event: any): void {
    const sharingUrl = `https://telegram.me/share/url?text=${this.sharingMsg}&url=${this.props.url}`;
    window.open(sharingUrl, "_blank");
  }
  private copyUrl(_event: any) {
    copyToClipboard(this.props.url);
    this.showCopiedFeedback();
  }

  public render(): RenderOutput {
    return (
      <ModalPopup
        width={318}
        closeHandler={this.props.closeHandler}
        header={<React.Fragment>
          <div className={css.icon}><img src={"/assets/images/Icon//share-blue.svg"} /></div>
          <div className={css.headerTitle}>Share</div>
          <Tooltip overlay="Close" placement="left">
            <div className={css.closeButton} onClick={this.props.closeHandler}><img src={"/assets/images/Icon/close-grey.svg"} /></div>
          </Tooltip>
        </React.Fragment>}
        body={<div className={css.link}>
          <div className={css.title}>Link</div>
          { this.state.showCopiedFeedback ?
            <div className={css.copied}>copied</div>
            : ""
          }
          <Tooltip overlay={this.props.url} placement="bottom">
            <div className={css.url}>{this.props.url}</div>
          </Tooltip>
          <Tooltip overlay="Copy Link" placement="right">
            <div onClick={this.copyUrl} className={css.copyButton}><img src={"/assets/images/Icon/Copy-blue.svg"}/></div>
          </Tooltip>
        </div>}
        footer={<div  className={css.socialSitesList}>
          <div onClick={this.selectTwitter} className={css.socialSite}><div className={css.icon}><img src={"/assets/images/Icon/social/twitter.svg"}/></div><div className={css.name}>Twitter</div></div>
          <div onClick={this.selectReddit} className={css.socialSite}><div className={css.icon}><img src={"/assets/images/Icon/social/reddit.svg"}/></div><div className={css.name}>Reddit</div></div>
          <div onClick={this.selectFacebook} className={css.socialSite}><div className={css.icon}><img src={"/assets/images/Icon/social/facebook.svg"}/></div><div className={css.name}>Facebook</div></div>
          <div onClick={this.selectTelegram} className={css.socialSite}><div className={css.icon}><img src={"/assets/images/Icon/social/telegram.svg"}/></div><div className={css.name}>Telegram</div></div>
        </div>}
      />
    );
  }
}
