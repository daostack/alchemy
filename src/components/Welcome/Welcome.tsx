import * as React from "react";

export interface WelcomeProps {
  compiler: string;
  framework: string;
}

export default class Welcome extends React.Component<WelcomeProps, undefined> {
  render() {
    return <div>
      <img src='/assets/images/Emergent+-+White@2x.png' />
      <h1>Hello from {this.props.compiler} and {this.props.framework}!</h1>
     </div>;
  }
}