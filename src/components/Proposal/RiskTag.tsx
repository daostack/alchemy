import * as React from "react";

import * as css from "./RiskTag.scss";

export interface IRisk {
    tag: string,
    text: string,
    className: string
}

interface IRiskProps {
    riskLevel: IRisk
}

type IProps = IRiskProps;

interface IState {
  expanded: boolean;
}

class RiskTag extends React.Component<IProps, IState> {
    state = { expanded: false };


  //set the text
  onMouseover () {
    this.setState({expanded : true})
  }
  //clear the text
  onMouseout () {
    this.setState({expanded : false})
  }

  public render(): RenderOutput {
    const {
        text,
        tag,
        className
    } = this.props.riskLevel;
    const { expanded } = this.state;

    return (
      <span
        className={css.wrapper}
        onMouseEnter={this.onMouseover.bind(this)}
        onMouseLeave={this.onMouseout.bind(this)}
      >
          <button className={className}>
              { /* space after <span> is there on purpose */ }
              {expanded ? 
                <span>{text}</span>
                :
                <span>{tag}</span>
              }
          </button>
      </span>
    );
  }

}

export default RiskTag;
