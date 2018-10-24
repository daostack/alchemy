import * as React from "react";
import { CookiesProvider } from 'react-cookie';
import { Provider } from "react-redux";
import { Route, Switch } from "react-router-dom";
import { ConnectedRouter } from "react-router-redux";

import { initializeWeb3 } from "./actions/initializeWeb3";
import { default as store, history } from "./configureStore";

import * as arcActions from "./actions/arcActions";

import AppContainer from "layouts/AppContainer";

initializeWeb3({ network: 'kovan', apiKey: '7bdc1e40cfbaec241aa5e18610d0afe9' });
export class App extends React.Component<undefined, undefined> {

  public render() {
    return (
      <Provider store={store}>
        <CookiesProvider>
          <ConnectedRouter history={history}>
            <Route path="/" component={AppContainer}/>
          </ConnectedRouter>
        </CookiesProvider>
      </Provider>
    );
  }
}
