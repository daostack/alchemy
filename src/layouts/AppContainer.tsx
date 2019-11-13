import { Address } from "@daostack/client";
import * as Sentry from "@sentry/browser";
import * as web3Actions from "actions/web3Actions";
import AccountProfilePage from "components/Account/AccountProfilePage";
import DaosPage from "components/Daos/DaosPage";
import MinimizedNotifications from "components/Notification/MinimizedNotifications";
import Notification, { NotificationViewStatus } from "components/Notification/Notification";
import DaoContainer from "components/Dao/DaoContainer";
import RedemptionsPage from "components/Redemptions/RedemptionsPage";
import * as History from "history";
import Header from "layouts/Header";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { connect } from "react-redux";
import { Route, Switch } from "react-router-dom";
import { ModalContainer } from "react-router-modal";
import { IRootState } from "reducers";
import { dismissNotification, INotificationsState, NotificationStatus, showNotification, INotification } from "reducers/notifications";
import { getCachedAccount, cacheWeb3Info, uncacheWeb3Info, gotoReadonly, pollForAccountChanges } from "arc";
import ErrorUncaught from "components/Errors/ErrorUncaught";
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

  private static hasAcceptedCookiesKey = "acceptedCookies";

  constructor(props: IProps) {
    super(props);
    this.state = {
      error: null,
      sentryEventId: null,
      notificationsMinimized: false,
    };
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

  public async UNSAFE_componentWillMount(): Promise<void> {
    /**
     * Heads up that there is a chance this cached account may differ from an account
     * that the user has already selected in a provider but have
     * not yet made available to the app.
     */
    const currentAddress = getCachedAccount();
    let accountWasCached = false;
    if (currentAddress) {
      accountWasCached = true;
      // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
        console.log(`new account: ${newAddress}`);
        this.props.setCurrentAccount(newAddress);
        if (newAddress) {
          cacheWeb3Info(newAddress);
        } else {
          uncacheWeb3Info();
          gotoReadonly(this.props.showNotification);
        }
      });
  }

  private clearError = () => {
    this.setState({ error: null, sentryEventId: null });
  }

  private dismissNotif = (id: string) => () => this.props.dismissNotification(id);
  private minimizeNotif = () => () => this.setState({notificationsMinimized: true});
  private unminimizeNotif = () => () => this.setState({notificationsMinimized: false});
  private headerHtml = ( props: any ): any => <Header {...props} />;

  private sortedNotification = () => (notif: INotification): any => {
    return <div key={notif.id}>
      <Notification
        title={(notif.title || notif.status).toUpperCase()}
        status={
          notif.status === NotificationStatus.Failure ?
            NotificationViewStatus.Failure :
            notif.status === NotificationStatus.Success ?
              NotificationViewStatus.Success :
              NotificationViewStatus.Pending
        }
        message={notif.message}
        fullErrorMessage={notif.fullErrorMessage}
        url={notif.url}
        timestamp={notif.timestamp}
        dismiss={this.dismissNotif(notif.id)}
        showNotification={this.props.showNotification}
        minimize={this.minimizeNotif()}
      />
    </div>; 
  }
              

  public render(): RenderOutput {
    
    const {
      sortedNotifications,
    } = this.props;

    if (this.state.error) {
      // Render error fallback UI
      // eslint-disable-next-line no-console
      console.error(this.state.error);
      return <div>
        <ErrorUncaught errorMessage={this.state.error.message} sentryEventId={this.state.sentryEventId} goHome={this.clearError}></ErrorUncaught>
      </div>;
    } else {

      const hasAcceptedCookies = !!localStorage.getItem(AppContainer.hasAcceptedCookiesKey);

      return (
        <div className={css.outer}>
          <BreadcrumbsItem to="/">Alchemy</BreadcrumbsItem>

          <div className={css.container}>
            <Route path="/" render={this.headerHtml} />

            <Switch>
              <Route path="/dao/:daoAvatarAddress" component={DaoContainer} />
              <Route path="/profile/:accountAddress" component={AccountProfilePage} />
              <Route path="/redemptions" component={RedemptionsPage} />
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
              <MinimizedNotifications notifications={sortedNotifications.length} unminimize={this.unminimizeNotif()} />
              :
              sortedNotifications.map(this.sortedNotification())
            }
          </div>
          <div className={css.background}></div>
          { hasAcceptedCookies ? "" :
            <div className={css.cookieDisclaimerContainer}>
              <div className={css.cookieDisclaimer}>
                <div className={css.body}>This website stores cookies on your computer. These cookies are used to collect information about how you interact with our website. We use this information for analytics in order to improve our website.</div>
                <div className={css.accept}><a href="#" onClick={this.handleAccept} className={css.blueButton} data-test-id="acceptCookiesButton"><img src="/assets/images/Icon/v-white-thick.svg"></img>Accept</a></div>
              </div>
            </div>
          }
        </div>
      );
    }
  }

  private handleAccept(): void {
    localStorage.setItem(AppContainer.hasAcceptedCookiesKey, "1");
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AppContainer);
