import * as Arc from '@daostack/arc.js';
import * as React from "react";
import * as ReactDOM from "react-dom";
import { AppContainer } from "react-hot-loader";

import { App } from "./App";

import "./assets/styles/global.scss";

async function renderApp() {
  try {
    Arc.ConfigService.set("estimateGas", true);
    await Arc.InitializeArcJs();
    if (process.env.NODE_ENV === 'development') {
      Arc.LoggingService.logLevel = Arc.LogLevel.all;
    }

    // Silence 240 sec error
    Arc.ContractWrappers.AbsoluteVote.contract.constructor.synchronization_timeout = 0;
    Arc.ContractWrappers.ContributionReward.contract.constructor.synchronization_timeout = 0;
    Arc.ContractWrappers.DaoCreator.contract.constructor.synchronization_timeout = 0;
    Arc.ContractWrappers.GenesisProtocol.contract.constructor.synchronization_timeout = 0;
    Arc.ContractWrappers.GlobalConstraintRegistrar.contract.constructor.synchronization_timeout = 0;
    Arc.ContractWrappers.SchemeRegistrar.contract.constructor.synchronization_timeout = 0;
    Arc.ContractWrappers.TokenCapGC.contract.constructor.synchronization_timeout = 0;
    Arc.ContractWrappers.UpgradeScheme.contract.constructor.synchronization_timeout = 0;
    Arc.ContractWrappers.VestingScheme.contract.constructor.synchronization_timeout = 0;
    Arc.ContractWrappers.VoteInOrganizationScheme.contract.constructor.synchronization_timeout = 0;
  } catch (e) {
    console.error(e);
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
