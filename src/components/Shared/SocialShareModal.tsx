import * as React from "react";
// @ts-ignore
import { Modal } from "react-router-modal";
import { copyToClipboard } from "lib/util";
import * as css from "./SocialShareModal.scss";


interface IProps {
  closeHandler: (event: any) => void;
  url: string;
}

export default class SocialShareModal extends React.Component<IProps, null> {

  constructor(props: IProps) {
    super(props);

    this.selectTwitter = this.selectTwitter.bind(this);
    this.selectReddit = this.selectReddit.bind(this);
    this.selectFacebook = this.selectFacebook.bind(this);
    this.selectTelegram = this.selectTelegram.bind(this);
    this.copyUrl = this.copyUrl.bind(this);
  }

  private handleSelectSocialSite(siteName: string): void {
    console.log(`selected ${siteName}`);
  }

  private selectTwitter(_event: any): void {
    this.handleSelectSocialSite("Twitter");
  }
  private selectReddit(_event: any): void {
    this.handleSelectSocialSite("Reddit");
  }
  private selectFacebook(_event: any): void {
    this.handleSelectSocialSite("Facebook");
  }
  private selectTelegram(_event: any): void {
    this.handleSelectSocialSite("Telegram");
  }
  private copyUrl(_event: any) {
    copyToClipboard(this.props.url);
  }

  public render() {
    return (
      <Modal onBackdropClick={this.props.closeHandler}>
        <div className={css.modalWindow}>
          <div className={css.header}>
            <div className={css.icon}><img src={"/assets/images/Icon/vote/for-btn-selected-w.svg"} /></div>
            <div className={css.title}>Share</div>
            <div className={css.closeButton} onClick={this.props.closeHandler}><img src={"/assets/images/Icon/close-grey.svg"} /></div>
          </div>
          <div className={css.content}>
            <div className={css.link}>
              <div className={css.title}>Link</div>
              <div className={css.url}>{this.props.url}</div>
              <div onClick={this.copyUrl} className={css.copyButton} title="Copy Link"><img src={"/assets/images/Icon/Copy-blue.svg"}/></div>
            </div>
            <hr/>
            <div  className={css.socialSitesList}>
              <div onClick={this.selectTwitter} className={css.socialSite}><div className={css.icon}><img src={"/assets/images/Icon/social/twitter.svg"}/></div><div className={css.name}>Twitter</div></div>
              <div onClick={this.selectReddit} className={css.socialSite}><div className={css.icon}><img src={"/assets/images/Icon/social/reddit.svg"}/></div><div className={css.name}>Reddit</div></div>
              <div onClick={this.selectFacebook} className={css.socialSite}><div className={css.icon}><img src={"/assets/images/Icon/social/facebook.svg"}/></div><div className={css.name}>Facebook</div></div>
              <div onClick={this.selectTelegram} className={css.socialSite}><div className={css.icon}><img src={"/assets/images/Icon/social/telegram.svg"}/></div><div className={css.name}>Telegram</div></div>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}
