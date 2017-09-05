import * as React from "react";

import Welcome from "./components/Welcome/Welcome";

export interface AppProps {
  compiler: string;
  framework: string;
}

// 'AppProps' describes the shape of props.
// State is never set so we use the 'undefined' type.
export class App extends React.Component<AppProps, undefined> {
  render() {
    return <Welcome {...this.props} />
  }
}