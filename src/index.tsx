import * as React from "react";
import * as ReactDOM from "react-dom";
import { AppContainer } from 'react-hot-loader'

import { App } from "./App";

function renderApp() {
  ReactDOM.render(
    <AppContainer>
      <App compiler="TypeScript" framework="React"/>
    </AppContainer>,
    document.querySelector('#root')
  );
}

if (module.hot) {
  module.hot.accept();
  renderApp();
} else {
  renderApp();
}