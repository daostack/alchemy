import {default as Tooltip, RCTooltip} from "rc-tooltip";
import * as React from "react";
import "./TrainingTooltip.scss";
import { IRootState } from "reducers";
import { connect } from "react-redux";

interface IAppStateProps {
  enableHover: boolean;
  showAll: boolean;
}

interface IStateProps {
  showingAll: boolean;
  turningOffShowingAll: boolean;
}

export interface IExternalProps extends RCTooltip.Props {

}

type IProps = IExternalProps & IAppStateProps;

const mapStateToProps = (state: IRootState & IAppStateProps, ownProps: IExternalProps): IExternalProps & IAppStateProps => {
  return {
    ...ownProps,
    enableHover: state.ui.trainingTooltipsOnHover,
    showAll: state.ui.trainingTooltipsShowAll,
  };
};

class TrainingToolip extends React.Component<IProps, IStateProps> {

  static getDerivedStateFromProps(nextProps: IProps, prevState: IStateProps): IStateProps|undefined {
    if (!nextProps.showAll && prevState.showingAll) {
      return { showingAll: false, turningOffShowingAll: true };
    } else if (nextProps.showAll && !prevState.showingAll) {
      return { showingAll: true, turningOffShowingAll: false };
    }
  }

  constructor(props: IProps) {
    super(props);
    this.state = { showingAll: false, turningOffShowingAll: false };
  }

  private tooltip = React.createRef<Tooltip>();

  public render(): RenderOutput {

    const extraProps = {} as any;

    if (this.props.showAll) {
      if (this.props.enableHover) {
        extraProps.visible = true;
      }
    } else if (this.state.turningOffShowingAll) {
      setTimeout(() => {
        (this.tooltip.current as any).trigger.onMouseLeave({});
      }, 0);
    }

    return (
      <Tooltip ref={this.tooltip} {...this.props} {...extraProps}
        prefixCls="rc-trainingtooltip"
        trigger={this.props.enableHover ? ["hover"] : []}
      >
        {this.props.children}
      </Tooltip>
    );
  }
}

export default connect(mapStateToProps)(TrainingToolip);
