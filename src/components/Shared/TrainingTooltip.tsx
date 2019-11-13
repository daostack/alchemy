import {default as Tooltip, RCTooltip} from "rc-tooltip";
import * as React from "react";
import "./TrainingTooltip.scss";
import { IRootState } from "reducers";
import { connect } from "react-redux";
import VisibilitySensor from "react-visibility-sensor";

interface IAppStateProps {
  enableHover: boolean;
  showAll: boolean;
}

interface IStateProps {
  showingAll: boolean;
  turningOffShowingAll: boolean;
  isVisible?: boolean;
}

export interface IExternalProps extends RCTooltip.Props {
  alwaysAvailable?: boolean;
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
    return null;
  }

  constructor(props: IProps) {
    super(props);
    this.state = { showingAll: false, turningOffShowingAll: false, isVisible: undefined };
    this.visibilityChanged = this.visibilityChanged.bind(this);
  }

  private tooltip = React.createRef<Tooltip>();

  private visibilityChanged(isVisible: boolean) {
    this.setState({isVisible});
  }

  private show(visible: boolean) {
    const trigger = (this.tooltip && this.tooltip.current) ? (this.tooltip.current as any).trigger : null;
    if (trigger) {
      setTimeout(() => {
        if (visible) {
          trigger.onMouseEnter({});
        } else {
          trigger.onMouseLeave({});
        }
      }, 0);
    }
  }
  public render(): RenderOutput {
    if (this.props.showAll) {
      if (this.props.enableHover) {
        this.show(true);
      }
    } else if (this.state.turningOffShowingAll) {
      this.show(false);
    }

    const tooltipHtml = <Tooltip ref={this.tooltip} {...this.props}
      prefixCls="rc-trainingtooltip"
      trigger={this.props.enableHover ? ["hover"] : []}
    >{this.props.children}</Tooltip>;

    if (this.props.alwaysAvailable) {
      return tooltipHtml;
    } else {
      return <VisibilitySensor scrollCheck resizeCheck intervalCheck={false} onChange={this.visibilityChanged}>
        {this.state.isVisible ? tooltipHtml : this.props.children }
      </VisibilitySensor>;
    }
  }
}

export default connect(mapStateToProps)(TrainingToolip);
