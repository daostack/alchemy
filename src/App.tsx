import { initializeArc } from "arc";
import Loading from "components/Shared/Loading";
import AppContainer from "layouts/AppContainer";
import * as React from "react";
import ReactGA from "react-ga";
import { Provider } from "react-redux";
import { Route, Switch } from "react-router-dom";
import { ConnectedRouter } from "react-router-redux";
import { ThroughProvider } from "react-through";
import { persistStore } from "redux-persist";
import { default as store, history } from "./configureStore";
import * as css from "./layouts/App.scss";

export class App extends React.Component<{}, {arcIsInitialized: boolean}> {
  constructor(props: {}) {
    super(props);
    this.state = {
      arcIsInitialized: false
    };
  }

  public async componentWillMount() {
    // Do this here because we need to have initialized Arc first
    // we initialize Arc
    initializeArc()
      .then(async () => {
        this.setState({ arcIsInitialized: true });
        persistStore(store);

      })
      .catch ((err) => {
        console.log(err);
      });

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
    history.listen((location: any) => {
      ReactGA.pageview(location.pathname + location.search);
    });
  }

  public render() {
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
