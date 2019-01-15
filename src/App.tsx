import * as React from "react";
import { CookiesProvider } from 'react-cookie';
import { Provider } from "react-redux";
import { Route, Switch } from "react-router-dom";
import { ConnectedRouter } from "react-router-redux";

import { default as store, history } from "./configureStore";

import AppContainer from "layouts/AppContainer";

export class App extends React.Component<undefined, undefined> {

  public render() {
    return (
      <Provider store={store}>
        <CookiesProvider>
          <ConnectedRouter history={history}>
            <Switch>
              <Route path="/" component={AppContainer}/>
            </Switch>
          </ConnectedRouter>
        </CookiesProvider>
      </Provider>
    );
  }
}
