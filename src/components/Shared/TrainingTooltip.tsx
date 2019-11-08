import {default as Tooltip, RCTooltip} from "rc-tooltip";
import * as React from "react";
// import * as css from "./TrainingTooltip.scss";
import "./TrainingTooltip.scss";

export interface IExternalProps extends RCTooltip.Props {

}

type IProps = IExternalProps;

export default class TrainingToolip extends React.Component<IProps, null> {

  public render(): RenderOutput {
    return (
      <Tooltip {...this.props} prefixCls="rc-trainingtooltip">
        {this.props.children}
      </Tooltip>
    );
  }
}
