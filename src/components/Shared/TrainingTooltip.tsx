import {default as Tooltip, RCTooltip} from "rc-tooltip";
import * as React from "react";
import "./TrainingTooltip.scss";
import { IRootState } from "reducers";
import { connect } from "react-redux";

interface IStateProps {
  enableHover: boolean;
}

export interface IExternalProps extends RCTooltip.Props {

}

type IProps = IExternalProps & IStateProps;

const mapStateToProps = (state: IRootState & IStateProps, ownProps: IExternalProps): IExternalProps & IStateProps => {
  return {
    ...ownProps,
    enableHover: state.ui.trainingTooltipsOnHover,
  };
};

class TrainingToolip extends React.Component<IProps, null> {

  public render(): RenderOutput {
    return (
      <Tooltip {...this.props} prefixCls="rc-trainingtooltip">
        {this.props.children}
      </Tooltip>
    );
  }
}

export default connect(mapStateToProps)(TrainingToolip);
