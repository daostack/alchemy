import Tooltip from "rc-tooltip";
import * as React from "react";
import * as css from "./HelpButton.scss";


export interface IExternalProps {
  text: string | JSX.Element;
  placement?: string;
}

type IProps = IExternalProps;

export default class HelpButton extends React.Component<IProps, null> {
  static helpTextProposalDescription = (<ul><li>Paste youtube or vimeo links to embed videos</li><li>Paste image links to embed images</li><li>Type in Markdown if you are feeling nerdish</li></ul>);

  public render(): RenderOutput {
    return (
      <Tooltip
        overlay={this.props.text}
        placement={this.props.placement}
        prefixCls="rc-helptooltip"
        trigger={["click"]}
      >
        {
        /**
         * image is from: https://commons.wikimedia.org/wiki/File:Ambox_question.svg
         */
        }
        <img className={css.image} src="/assets/images/Icon/question-help.svg" />
      </Tooltip>
    );
  }
}
