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

class ViewSharingButtonsContainer extends React.Component<RouteComponentProps<{}>, null> {

  public render() {
    const href = window.location.href;
    return (
      <div className={css.socialMediaShareButtonContainer}>
        Share on:
        <FacebookShareButton url={href}>
          <FacebookIcon size={16} />
        </FacebookShareButton>
        <TwitterShareButton url={href}>
          <TwitterIcon size={16} />
        </TwitterShareButton>
        <LinkedinShareButton url={href}>
          <LinkedinIcon size={16} />
        </LinkedinShareButton>
      </div>
    );
  }
}

export default ViewSharingButtonsContainer;
