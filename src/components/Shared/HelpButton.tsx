import Tooltip from "rc-tooltip";
import * as React from "react";
import * as css from "./HelpButton.scss";
import i18next from "i18next";

export interface IExternalProps {
  text: string | JSX.Element;
  placement?: string;
}

type IProps = IExternalProps;

export default class HelpButton extends React.Component<IProps, null> {
  static helpTextProposalDescription = i18next.t("Help Button Tooltip");

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
