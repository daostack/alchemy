// const Web3 = require("web3");
import { Address } from "@daostack/client";
import * as Sentry from "@sentry/browser";
import * as web3Actions from "actions/web3Actions";
import { checkMetaMask, getCurrentAccountAddress, pollForAccountChanges } from "arc";
import AccountProfileContainer from "components/Account/AccountProfileContainer";
import DaoListContainer from "components/DaoList/DaoListContainer";
import HomeContainer from "components/Home/HomeContainer";
import MinimizedNotifications from "components/Notification/MinimizedNotifications";
import Notification, { NotificationViewStatus } from "components/Notification/Notification";
import ViewDaoContainer from "components/ViewDao/ViewDaoContainer";
import * as History from "history";
import HeaderContainer from "layouts/HeaderContainer";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { Cookies, withCookies } from "react-cookie";
import { connect } from "react-redux";
import { Route, Switch } from "react-router-dom";
//@ts-ignore
import { ModalContainer } from "react-router-modal";
import { IRootState } from "reducers";
import { dismissNotification, INotificationsState, NotificationStatus, showNotification } from "reducers/notifications";
import { sortedNotifications } from "../selectors/notifications";
import * as css from "./App.scss";

interface IStateProps {
  cookies: Cookies;
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
  error: string;
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
    this.setState({ error: error.toString() });

    Sentry.withScope((scope) => {
      scope.setExtras(errorInfo);
      const sentryEventId = Sentry.captureException(error);
      this.setState({ sentryEventId });
    });
  }

  public async componentWillMount() {
    // we initialize Arc
    // const initializeArc = async () => {};
    // initializeArc();
      // .then(async () => {
        // if Metamask is available, we wathc for any account changes
    let metamask: any;
    const currentAddress = await getCurrentAccountAddress();
    if (currentAddress)  {
      console.log(`using address from web3 connection: ${currentAddress}`);
      this.props.cookies.set("currentAddress", currentAddress, { path: "/"});
      this.props.setCurrentAccount(currentAddress);
    } else {
      const currentAddressFromCookie = this.props.cookies.get("currentAddress");
      if (currentAddressFromCookie) {
        console.log(`using address from cookie: ${currentAddressFromCookie}`);
        this.props.setCurrentAccount(currentAddressFromCookie);
      } else {
        this.props.cookies.set("currentAddress", "", { path: "/"});
        this.props.setCurrentAccount(undefined);
      }
    }

    try {
      metamask = await checkMetaMask();
    } catch (err) {
      console.log("MM not available or not set correctly: using default web3 provider: ", err.message);
    }

    if (metamask) {
      pollForAccountChanges(currentAddress).subscribe(
        (newAddress: Address) => {
          if (newAddress && checkMetaMask()) {
            console.log(`new address: ${newAddress}`);
            this.props.setCurrentAccount(newAddress);
            this.props.cookies.set("currentAddress", newAddress, { path: "/"});
            // TODO: we reload on setting a new account,
            // but it would be more elegant if we did not need to
            window.location.reload();
          }
        });
      }
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
      return <div>
        <a onClick={() => Sentry.showReportDialog({ eventId: this.state.sentryEventId })}>Report feedback</a>
        <pre>{ this.state.error }</pre>
      </div>;
    } else {
      return (
        <div className={css.outer}>
          <BreadcrumbsItem to="/">Alchemy</BreadcrumbsItem>
            <div className={css.container}>
              <Route path="/"
                render={ ( props ) => ( props.location.pathname !== "/") && <HeaderContainer {...props} /> } />

              <Switch>
                <Route path="/dao/:daoAvatarAddress" component={ViewDaoContainer} />
                <Route exact={true} path="/daos" component={DaoListContainer} />
                <Route path="/profile/:accountAddress" component={AccountProfileContainer} />
                <Route path="/" component={HomeContainer} />
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

export default connect(mapStateToProps, mapDispatchToProps)(withCookies(AppContainer));
