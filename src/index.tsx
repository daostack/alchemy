import { library } from "@fortawesome/fontawesome-svg-core";
import { faFacebook, faGithub, faTwitter } from "@fortawesome/free-brands-svg-icons";
import * as Sentry from "@sentry/browser";
import * as Mixpanel from "mixpanel-browser";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { AppContainer } from "react-hot-loader";

import { App } from "./App";

import "./assets/styles/global.scss";

async function renderApp() {
  // Add icons we want to use from FontAwesome
  library.add(faGithub, faTwitter, faFacebook);

  if (process.env.NODE_ENV === "production") {
    Sentry.init({
      dsn: "https://748c6f9811fe407ca2853b64bf638690@sentry.io/1419793",
      environment: process.env.NODE_ENV,
    });
  }

  if (process.env.NODE_ENV === "staging" || process.env.NODE_ENV === "production") {
    Mixpanel.init(process.env.MIXPANEL_TOKEN);
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
