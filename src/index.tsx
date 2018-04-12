import * as Arc from '@daostack/arc.js';
import * as React from "react";
import * as ReactDOM from "react-dom";
import { AppContainer } from "react-hot-loader";

import { App } from "./App";

import "./assets/styles/global.scss";

async function renderApp() {
  try {
    await Arc.InitializeArc();
  } catch (e) {
  }

  ReactDOM.render(
    <AppContainer>
      <App />
    </AppContainer>,
    document.querySelector("#root"),
  );
}

if (module.hot) {
  module.hot.accept();
  renderApp();
} else {
  renderApp();
}
