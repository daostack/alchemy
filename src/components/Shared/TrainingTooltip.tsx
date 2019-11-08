import {default as Tooltip, RCTooltip} from "rc-tooltip";
import * as React from "react";
import "./TrainingTooltip.scss";
import { IRootState } from "reducers";
import { connect } from "react-redux";

interface IAppStateProps {
  enableHover: boolean;
}

interface IStateProps {
  visible: boolean;
}

export interface IExternalProps extends RCTooltip.Props {

}

type IProps = IExternalProps & IStateProps & IAppStateProps;

const mapStateToProps = (state: IRootState & IAppStateProps, ownProps: IExternalProps): IExternalProps & IAppStateProps => {
  return {
    ...ownProps,
    enableHover: state.ui.trainingTooltipsOnHover,
  };
};

class TrainingToolip extends React.Component<IProps, IStateProps> {

  constructor(props: IProps) {
    super(props);
    this.state = { visible: true };
  }

  private afterVisibleChange = () => (visible: boolean) => {
    if (visible !== this.state.visible)
    {
      this.setState({ visible });
    }
  }

  public render(): RenderOutput {

    return (
      <Tooltip {...this.props}
        prefixCls="rc-trainingtooltip"
        trigger={this.props.enableHover ? ["hover"] : []}
        // visible={this.props.enableHover && (!this.props.trigger || !!this.props.trigger.length)}
        afterVisibleChange={this.afterVisibleChange()}>
        {this.props.children}
      </Tooltip>
    );
  }
}

export default connect(mapStateToProps)(TrainingToolip);
