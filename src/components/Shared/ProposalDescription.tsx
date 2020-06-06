import * as React from "react";
import * as css from "./ProposalDescription.scss";
const ReactMarkdown = require("react-markdown");

interface IExternalProps {
  description: string;
}

export default class ProposalDescription extends React.Component<IExternalProps> {

  private parseYouTubeVideoIdFromUri = (url: string): string => {
    const match = url.match(/(\/|%3D|v=)([0-9A-z-_]{11})([%#?&]|$)/);
    if (match) {
      if (match.length >= 3) {
        return match[2];
      } else {
      // eslint-disable-next-line no-console
        console.error("The outube url is not valid.");
      }
    }
    return null;
  };

  private getVimeoIdFromUrl = (url: string): string => {
    const match = url.match(/^.*(?:vimeo.com)\/(?:channels\/|channels\/\w+\/|groups\/[^/]*\/videos\/|album\/\d+\/video\/|video\/|)(\d+)(?:$|\/|\?)/);
    if (match) {
      if (match.length >= 2) {
        return match[1];
      } else {
      // eslint-disable-next-line no-console
        console.error("The vimeo url is not valid.");
      }
    }
    return null;
  };

  private renderDescription = (props: { href: string; children: React.ReactNode }) => {
    if (props.href) {
      try {
        const url = new URL(props.href);
        const videoId = this.parseYouTubeVideoIdFromUri(props.href);
        if (videoId) {
          const start = url.searchParams.get("t") || "0";

          return <iframe className={css.embeddedVideo} frameBorder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
            src={`${url.protocol}//www.youtube-nocookie.com/embed/${videoId}?start=${start}`}>
          </iframe>;
        } else {
          const videoId = this.getVimeoIdFromUrl(props.href);
          if (videoId) {
            return <iframe className={css.embeddedVideo} frameBorder="0" allow="autoplay; fullscreen" allowFullScreen
              src={`${url.protocol}//player.vimeo.com/video/${videoId}`}>
            </iframe>;
          }
        }
      } catch (e) {
        console.error(e)
      }
    }

    return <a href={props.href} target="_blank" rel="noopener noreferrer">{props.children}</a>;
  }

  public render(): RenderOutput {
    return <ReactMarkdown source={this.props.description} renderers={{ link: this.renderDescription }} />;
  }
}
