import { library } from "@fortawesome/fontawesome-svg-core";
import { faFacebook, faGithub, faTwitter } from "@fortawesome/free-brands-svg-icons";
import { init as sentryInit } from "@sentry/browser";
import * as React from "react";
import { render } from "react-dom";
import { AppContainer } from "react-hot-loader";

import { App } from "./App";

import "./assets/styles/global.scss";

async function renderApp() {
  // Add icons we want to use from FontAwesome
  library.add(faGithub, faTwitter, faFacebook);

  if (process.env.NODE_ENV === "production") {
    sentryInit({
      dsn: "https://748c6f9811fe407ca2853b64bf638690@sentry.io/1419793",
      environment: process.env.NODE_ENV,
    });
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
