// const Web3 = require("web3");
import { Address } from "@daostack/client";
import * as Sentry from "@sentry/browser";
import * as web3Actions from "actions/web3Actions";
import { getWeb3ProviderInfo, pollForAccountChanges, IWeb3ProviderInfo, setWeb3ProviderAndWarn, gotoReadonly } from "arc";
import AccountProfilePage from "components/Account/AccountProfilePage";
import DaosPage from "components/Daos/DaosPage";
import MinimizedNotifications from "components/Notification/MinimizedNotifications";
import Notification, { NotificationViewStatus } from "components/Notification/Notification";
import DaoContainer from "components/Dao/DaoContainer";
import * as History from "history";
import Header from "layouts/Header";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { connect } from "react-redux";
import { Route, Switch } from "react-router-dom";
//@ts-ignore
import { ModalContainer } from "react-router-modal";
import { IRootState } from "reducers";
import { dismissNotification, INotificationsState, NotificationStatus, showNotification } from "reducers/notifications";
import { sortedNotifications } from "../selectors/notifications";
import * as css from "./App.scss";

interface IStateProps {
  currentAccountAddress: string;
  history: History.History;
  sortedNotifications: INotificationsState;
}

const mapStateToProps = (state: IRootState, ownProps: any): IStateProps => ({
  currentAccountAddress: state.web3.currentAccountAddress,
  history: ownProps.history,
  sortedNotifications: sortedNotifications()(state),
});

interface IDispatchProps {
  dismissNotification: typeof dismissNotification;
  setCurrentAccount: typeof web3Actions.setCurrentAccount;
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  dismissNotification,
  setCurrentAccount: web3Actions.setCurrentAccount,
  showNotification,
};

type IProps = IStateProps & IDispatchProps;

interface IState {
  error: Error;
  sentryEventId: string;
  notificationsMinimized: boolean;
}

class AppContainer extends React.Component<IProps, IState> {

  private static accountStorageKey = "currentAddress";
  private static walletConnectStorageKey = "walletconnect";
  private static providerStorageKey = "currentWeb3ProviderInfo";
  private static hasAcceptedCookiesKey = "acceptedCookies";

  constructor(props: IProps) {
    super(props);
    this.state = {
      error: null,
      sentryEventId: null,
      notificationsMinimized: false,
    };

    this.loadCachedWeb3Provider = this.loadCachedWeb3Provider.bind(this);
  }

  public componentDidCatch(error: Error, errorInfo: any): void {
    this.setState({ error });

    if (process.env.NODE_ENV === "production") {
      Sentry.withScope((scope): void => {
        scope.setExtras(errorInfo);
        const sentryEventId = Sentry.captureException(error);
        this.setState({ sentryEventId });
      });
    }
  }

  public async componentWillMount(): Promise<void> {
    /**
     * Heads up that there is a chance this cached account may differ from an account
     * that the user has already selected in a provider but have
     * not yet made available to the app.
     */
    const currentAddress = this.getCachedAccount();
    let accountWasCached = false;
    if (currentAddress) {
      accountWasCached = true;
      console.log(`using account from local storage: ${currentAddress}`);
    }

    this.props.setCurrentAccount(currentAddress);
    /**
     * Only supply currentAddress if it was obtained from a provider.  The poll
     * is only comparing changes with respect to the provider state.  Passing it a cached state
     * will only cause it to get the wrong impression and misbehave.
     */
    pollForAccountChanges(accountWasCached ? null : currentAddress).subscribe(
      (newAddress: Address | null): void => {
        console.log(`new account: ${newAddress}`);
        this.props.setCurrentAccount(newAddress);
        if (newAddress) {
          this.cacheWeb3Info(newAddress);
        } else {
          this.uncacheWeb3Info();
          gotoReadonly(this.props.showNotification);
        }
      });
  }

  private async loadCachedWeb3Provider(showNotification: any): Promise<boolean> {
    const web3ProviderInfo = this.getCachedWeb3ProviderInfo();
    if (web3ProviderInfo) {
      let success = false;
      /**
       * If successful, this will result in setting the current account which
       * we'll pick up below.
       */
      try {
        if (await setWeb3ProviderAndWarn(web3ProviderInfo, showNotification)) {
          console.log("using cached web3Provider");
          success = true;
        }
      // eslint-disable-next-line no-empty
      } catch(ex) { }
      if (!success) {
        console.log("failed to instantiate cached web3Provider");
        this.uncacheWeb3Info();
      }
      return success;
    }
    return false;
  }

  public render(): any {
    const {
      // connectionStatus,
      dismissNotification,
      showNotification,
      sortedNotifications,
    } = this.props;

    if (this.state.error) {
      // Render error fallback UI
      console.log(this.state.error);
      return <div>
        <a onClick={(): void => Sentry.showReportDialog({ eventId: this.state.sentryEventId })}>Report feedback</a>
        <pre>{ this.state.error.toString() }</pre>
      </div>;
    } else {

      const hasAcceptedCookies = !!localStorage.getItem(AppContainer.hasAcceptedCookiesKey);

      return (
        <div className={css.outer}>
          <BreadcrumbsItem to="/">Alchemy</BreadcrumbsItem>

          <div className={css.container}>
            <Route path="/"
            // eslint-disable react/jsx-no-bind
              render={( props ): any => {
                return <Header
                  getCachedWeb3ProviderInfo={this.getCachedWeb3ProviderInfo}
                  loadCachedWeb3Provider={this.loadCachedWeb3Provider}
                  {...props} />;
              }
              } />

            <Switch>
              <Route path="/dao/:daoAvatarAddress" component={DaoContainer} />
              <Route path="/profile/:accountAddress" component={AccountProfilePage} />
              <Route path="/" component={DaosPage} />
            </Switch>

            <ModalContainer
              backdropClassName={css.backdrop}
              containerClassName={css.modalContainer}
              bodyModalClassName={css.modalBody}
            />
          </div>

          <div className={css.pendingTransactions}>
            {this.state.notificationsMinimized ?
              <MinimizedNotifications
                notifications={sortedNotifications.length}
                unminimize={() => this.setState({notificationsMinimized: false})}
              /> :
              sortedNotifications.map(({id, status, title, message, fullErrorMessage, timestamp, url}): any => (
                <div key={id}>
                  <Notification
                    title={(title || status).toUpperCase()}
                    status={
                      status === NotificationStatus.Failure ?
                        NotificationViewStatus.Failure :
                        status === NotificationStatus.Success ?
                          NotificationViewStatus.Success :
                          NotificationViewStatus.Pending
                    }
                    message={message}
                    fullErrorMessage={fullErrorMessage}
                    url={url}
                    timestamp={timestamp}
                    dismiss={() => dismissNotification(id)}
                    showNotification={showNotification}
                    minimize={() => this.setState({notificationsMinimized: true})}
                  />
                </div>
              ))
            }
          </div>
          <div className={css.background}></div>
          { hasAcceptedCookies ? "" :
            <div className={css.cookieDisclaimerContainer}>
              <div className={css.cookieDisclaimer}>
                <div className={css.body}>This website stores cookies on your computer. These cookies are used to collect information about how you interact with our website. We use this information for analytics in order to improve our website.</div>
                <div className={css.accept}><a href="#" onClick={this.handleAccept} className={css.blueButton}><img src="/assets/images/Icon/v-white-thick.svg"></img>Accept</a></div>
              </div>
            </div>
          }
        </div>
      );
    }
  }

  private cacheWeb3Info(account: Address): void {
    if (account) {
      localStorage.setItem(AppContainer.accountStorageKey, account);4;
    } else {
      localStorage.removeItem(AppContainer.accountStorageKey);
    }
    const providerInfo = getWeb3ProviderInfo();
    if (providerInfo) {
      localStorage.setItem(AppContainer.providerStorageKey, JSON.stringify(providerInfo));
    } else {
      localStorage.removeItem(AppContainer.providerStorageKey);
      // hack until fixed by WalletConnect
      localStorage.removeItem(AppContainer.walletConnectStorageKey);
    }
  }

  private uncacheWeb3Info(): void {
    localStorage.removeItem(AppContainer.accountStorageKey);
    localStorage.removeItem(AppContainer.providerStorageKey);
    // hack until fixed by WalletConnect
    localStorage.removeItem(AppContainer.walletConnectStorageKey);
  }

  private getCachedAccount(): Address | null {
    return localStorage.getItem(AppContainer.accountStorageKey);
  }

  private getCachedWeb3ProviderInfo(): IWeb3ProviderInfo | null {
    const cached = localStorage.getItem(AppContainer.providerStorageKey);
    return cached ? JSON.parse(cached) : null;
  }

  private handleAccept(): void {
    localStorage.setItem(AppContainer.hasAcceptedCookiesKey, "1");
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AppContainer);
