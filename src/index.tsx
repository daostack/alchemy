import * as Arc from '@daostack/arc.js';
import * as Arc2 from '@daostack/client'
import * as React from "react";
import * as ReactDOM from "react-dom";
import { AppContainer } from "react-hot-loader";
import axios from "axios";
import BigNumber from "bignumber.js";

import { App } from "./App";

import "./assets/styles/global.scss";
import Util from 'lib/util';

async function renderApp() {
  console.time('Time until readyToShow');
  try {
    const graphqlHttpProvider: string = 'http://127.0.0.1:8000/by-name/daostack/graphql'
    const graphqlWsProvider: string = 'ws://127.0.0.1:8001/by-name/daostack'
    const web3Provider: string = 'http://127.0.0.1:8545'
    let arc = new Arc2.Arc({
      graphqlHttpProvider,
      graphqlWsProvider,
      web3Provider
    })

    let daos = arc.daos()
    const consumer = await daos.subscribe(
      (eventData: any) => {
        // Do something on receipt of the event
        console.log(eventData)
      },
      (err: any) => {
        throw err
      }
    )

    console.time('InitalizeArcJs')
    Arc.ConfigService.set("estimateGas", true);
    Arc.ConfigService.set("txDepthRequiredForConfirmation", { kovan: 0, live: 0});
    const deployedContractAddresses = require('../config/migration.json')

    await Arc.InitializeArcJs({
      deployedContractAddresses,
      watchForAccountChanges: true
    })
    console.timeEnd('InitalizeArcJs')

    console.time('Arc.Utils.getWeb3()')
    const web3 = await Arc.Utils.getWeb3();
    console.timeEnd('Arc.Utils.getWeb3()')
    Arc.ConfigService.set("gasPriceAdjustment", async (defaultGasPrice: BigNumber) => {
      try {
        const network = await Arc.Utils.getNetworkName();
        if (network.toLowerCase() === 'live') {
          const response = await axios.get('https://ethgasstation.info/json/ethgasAPI.json');
          // the api gives results if 10*Gwei
          const gasPrice = response.data.fast / 10;
          return web3.toWei(gasPrice, 'gwei');
        } else {
          return defaultGasPrice;
        }
      } catch (e) {
        return defaultGasPrice;
      }
    })

    Arc.LoggingService.logLevel = Arc.LogLevel.all;

    // Silence 240 sec error
    if (Arc.ContractWrappers.AbsoluteVote === undefined) {
      throw Error(`Arc.js could not find all DAOStack contracts -- are you sure they are deployed in the current network?\n(Arc.ContractWrappers.AbsoluteVote is undefined)`)
    }
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

    Arc.AccountService.subscribeToAccountChanges(() => {
      window.location.reload()
    })
  } catch (e) {
    console.error(e);
    throw(e)
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
