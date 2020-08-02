import * as React from "react";

import * as css from "./RiskTag.scss";

interface IRiskProps {
    riskLevel: string
}

type IProps = IRiskProps;

interface IState {
  text: string;
}

class RiskTag extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
    this.state = { text : 'H' }
  }
  //set the text
  onMouseover () {
    this.setState({text : 'High level'})
  }
  //clear the text
  onMouseout () {
    this.setState({text : 'H'})
  }

  public render(): RenderOutput {
    // const {
    //     riskLevel,
    // } = this.props;
    const { text } = this.state;
    return (
      <span
        className={css.wrapper}
        onMouseEnter={this.onMouseover.bind(this)}
        onMouseLeave={this.onMouseout.bind(this)}
      >
          <button>
              { /* space after <span> is there on purpose */ }
              <span >{text}</span>
          </button>
      </span>
    );
  }

}

export default RiskTag;
