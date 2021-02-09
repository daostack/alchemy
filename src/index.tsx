import { library } from "@fortawesome/fontawesome-svg-core";
import { faGithub } from "@fortawesome/free-brands-svg-icons/faGithub";
import { faTwitter } from "@fortawesome/free-brands-svg-icons/faTwitter";
import * as Mixpanel from "mixpanel-browser";
import * as React from "react";
import { render } from "react-dom";
import { AppContainer } from "react-hot-loader";

import { App } from "./App";

import "./assets/styles/global.scss";

async function renderApp() {
  // Add icons we want to use from FontAwesome
  library.add(faGithub, faTwitter);

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
