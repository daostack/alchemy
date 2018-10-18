import * as React from "react";
import { RouteComponentProps } from "react-router-dom";
import {
  FacebookShareButton,
  FacebookIcon,
  LinkedinShareButton,
  LinkedinIcon,
  TwitterShareButton,
  TwitterIcon
} from "react-share";
import * as css from "./SharingButtons.scss";

interface IProps {
  size: number;
  shareText: string;
}

class SharingButtons extends React.Component<IProps, null> {

  public render() {
    const href = window.location.href;
    return (
      <div className={css.sharingButtons}>
        Share with:
        <FacebookShareButton url={href} quote={this.props.shareText}>
          <FacebookIcon size={this.props.size} />
        </FacebookShareButton>
        <TwitterShareButton url={href} title={this.props.shareText}>
          <TwitterIcon size={this.props.size} />
        </TwitterShareButton>
        <LinkedinShareButton url={href} title={this.props.shareText}>
          <LinkedinIcon size={this.props.size} />
        </LinkedinShareButton>
      </div>
    );
  }
}

export default SharingButtons;
