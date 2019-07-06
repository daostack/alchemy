// const Web3 = require("web3");
import { Address } from "@daostack/client";
import * as Sentry from "@sentry/browser";
import * as web3Actions from "actions/web3Actions";
import { getCurrentAccountAddress, pollForAccountChanges } from "arc";
import AccountProfileContainer from "components/Account/AccountProfileContainer";
import DaoListContainer from "components/DaoList/DaoListContainer";
import MinimizedNotifications from "components/Notification/MinimizedNotifications";
import Notification, { NotificationViewStatus } from "components/Notification/Notification";
import ViewDaoContainer from "components/ViewDao/ViewDaoContainer";
import * as History from "history";
import HeaderContainer from "layouts/HeaderContainer";
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

const mapStateToProps = (state: IRootState, ownProps: any) => ({
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

  constructor(props: IProps) {
    super(props);
    this.state = {
      error: null,
      sentryEventId: null,
      notificationsMinimized: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ error });

    if (process.env.NODE_ENV === "PRODUCTION") {
      Sentry.withScope((scope) => {
        scope.setExtras(errorInfo);
        const sentryEventId = Sentry.captureException(error);
        this.setState({ sentryEventId });
      });
    }
  }

  public async componentWillMount() {
    const storageKey = "currentAddress";
    /**
     * getCurrentAccountAddress is checking the provider state.
     * It will always return null on a clean browser refresh since
     * in that case we will not at this point yet have a provider.
     * But if we ever happen to get here via an internal app refresh, then
     * we may have a provider and could potentially get a non-null account.
     */
    let currentAddress = await getCurrentAccountAddress() || null;
    let accountWasCached = false;
    if (currentAddress)  {
      console.log(`using account from existing web3Provider: ${currentAddress}`);
      localStorage.setItem(storageKey, currentAddress);
    } else {
      /**
       * Heads up that there is a chance this cached account may differ from an account
       * that the user has already selected in a provider but have
       * not yet made available to the app (if the account were available we'd have caught it
       * with getCurrentAccountAddress).
       */
      currentAddress = localStorage.getItem(storageKey) || null;
      if (currentAddress) {
        accountWasCached = true;
        console.log(`using account from local storage: ${currentAddress}`);
      } else {
        localStorage.removeItem(storageKey);
      }
    }

    this.props.setCurrentAccount(currentAddress);

    // try {
    //   await checkWeb3Provider();
    // } catch (err) {
    //   console.log("web3 provider not injected or set to wrong network: ", err.message);
    // }

    /**
     * Only supply currentAddress if it was obtained from a provider.  The poll
     * is only comparing changes with respect to the provider state.  Passing it a cached state
     * will only cause it to get the wrong impression and misbehave.
     */
    pollForAccountChanges(accountWasCached ? null : currentAddress).subscribe(
      (newAddress: Address | null) => {
        console.log(`new account: ${newAddress}`);
        this.props.setCurrentAccount(newAddress);
        if (newAddress) {
          localStorage.setItem(storageKey, newAddress);
        } else {
          localStorage.removeItem(storageKey);
        }
        // TODO: we reload on setting a new account,
        // but it would be more elegant if we did not need to
        // window.location.reload();
      });
  }

  public render() {
    const {
      // connectionStatus,
      dismissNotification,
      showNotification,
      sortedNotifications,
    } = this.props;

    if (this.state.error) {
      // Render error fallback UI
      // TODO: style this!
      console.log(this.state.error);
      return <div>
        <a onClick={() => Sentry.showReportDialog({ eventId: this.state.sentryEventId })}>Report feedback</a>
        <pre>{ this.state.error.toString() }</pre>
      </div>;
    } else {
      return (
        <div className={css.outer}>
          <BreadcrumbsItem to="/">Alchemy</BreadcrumbsItem>

          <div className={css.container}>
            <Route path="/" render={ ( props ) => <HeaderContainer {...props} /> } />

            <Switch>
              <Route path="/dao/:daoAvatarAddress" component={ViewDaoContainer} />
              <Route path="/profile/:accountAddress" component={AccountProfileContainer} />
              <Route path="/" component={DaoListContainer} />
            </Switch>

            <ModalContainer
              modalClassName={css.modal}
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
              sortedNotifications.map(({id, status, title, message, fullErrorMessage, timestamp, url}) => (
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
                  <br/>
                </div>
              ))
            }
          </div>
          <div className={css.background}></div>
        </div>
      );
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AppContainer);
