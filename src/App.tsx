import { initializeArc } from "arc";
import Loading from "components/Shared/Loading";
import AppContainer from "layouts/AppContainer";
import * as React from "react";
import ReactGA from "react-ga";
import { Provider } from "react-redux";
import { Route, Switch } from "react-router-dom";
import { ConnectedRouter } from "react-router-redux";
import { ThroughProvider } from "react-through";
import { history, default as store } from "./configureStore";
import * as css from "./layouts/App.scss";

export class App extends React.Component<{}, {arcIsInitialized: boolean}> {
  constructor(props: {}) {
    super(props);
    this.state = {
      arcIsInitialized: false,
    };
  }

  public async componentWillMount(): Promise<void> {
    // Do this here because we need to have initialized Arc first.  This will
    // not create a provider for the app, rather will just initialize Arc with a
    // readonly provider with no account, internal only to it.
    const initialized = await initializeArc()
      .catch ((err): boolean => {
        // eslint-disable-next-line no-console
        console.log(err);
        return false;
      });

    this.setState({ arcIsInitialized: initialized });

    let GOOGLE_ANALYTICS_ID: string;
    switch (process.env.NODE_ENV) {
      case "production": {
        // the "real" id
        GOOGLE_ANALYTICS_ID = "UA-142546205-1";
        break;
      }
      default: {
        // the "test" id
        GOOGLE_ANALYTICS_ID = "UA-142546205-2";
      }
    }
    ReactGA.initialize(GOOGLE_ANALYTICS_ID);
    history.listen((location: any): void => {
      ReactGA.pageview(location.pathname + location.search);
    });
  }

  public render(): any {
    if (!this.state.arcIsInitialized) {
      return <div className={css.loading}><Loading/></div>;
    } else  {
      return (
        <Provider store={store}>
          <ThroughProvider>
            <ConnectedRouter history={history}>
              <Switch>
                <Route path="/" component={AppContainer}/>
              </Switch>
            </ConnectedRouter>
          </ThroughProvider>
        </Provider>
      );
    }
  }
}
