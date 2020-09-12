import { init as sentryInit } from "@sentry/browser";
import * as Mixpanel from "mixpanel-browser";
import * as React from "react";
import { render } from "react-dom";
import { AppContainer } from "react-hot-loader";
import "./i18n";

import { App } from "./App";

import "./assets/styles/global.scss";

async function renderApp() {

  if (process.env.NODE_ENV === "production") {
    sentryInit({
      dsn: "https://748c6f9811fe407ca2853b64bf638690@sentry.io/1419793",
      environment: process.env.NODE_ENV,
    });
  }

  if (process.env.MIXPANEL_TOKEN && (process.env.NODE_ENV === "production")) {
    Mixpanel.init(process.env.MIXPANEL_TOKEN);
  }

  render(
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
