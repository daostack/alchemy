import * as History from "history";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { Cookies, withCookies } from "react-cookie";
import { connect } from "react-redux";
import { Route, Switch } from "react-router-dom";
//@ts-ignore
import { ModalContainer, ModalRoute } from "react-router-modal";
import { Address } from "@daostack/client";
import * as web3Actions from "actions/web3Actions";
import { getArc, pollForAccountChanges, checkNetwork } from "arc";
import AccountProfileContainer from "components/Account/AccountProfileContainer";
import CreateProposalContainer from "components/CreateProposal/CreateProposalContainer";
import DaoListContainer from "components/DaoList/DaoListContainer";
import HomeContainer from "components/Home/HomeContainer";
import MinimizedNotifications from "components/Notification/MinimizedNotifications";
import Notification, { NotificationViewStatus } from "components/Notification/Notification";
import ViewDaoContainer from "components/ViewDao/ViewDaoContainer";
import HeaderContainer from "layouts/HeaderContainer";
import { IRootState } from "reducers";
import { dismissNotification, INotificationsState, NotificationStatus, showNotification } from "reducers/notifications";
import { sortedNotifications } from "../selectors/notifications";
import * as css from "./App.scss";

interface IStateProps {
  cookies: Cookies;
  history: History.History;
  sortedNotifications: INotificationsState;
}

const mapStateToProps = (state: IRootState, ownProps: any) => ({
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
  notificationsMinimized: boolean;
}

class AppContainer extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
    this.state = { notificationsMinimized: false };
  }

  public async componentWillMount() {
    const { cookies, history } = this.props;

    // If this person has not seen the disclaimer, show them the home page
    if (!cookies.get("seen_disclaimer")) {
      cookies.set("seen_disclaimer", "true", { path: "/" });
      history.replace("/");
    }
  }

  public async componentDidMount() {
    // get the Arc object as early the lifetime of the app
    const arc = getArc();

    // once we have an account, or it changes, we notifiy the redux store about it
    pollForAccountChanges(arc.web3).subscribe(
      (next: Address) => {
        try {
          checkNetwork(arc.web3);
          // only set the account if the network is correct
          this.props.setCurrentAccount(next);
        } catch (err) {
          console.warn(err.message);
          // TODO: this notification is NOT working: why?
          showNotification(NotificationStatus.Failure, err.message);
        }
      }
    );
  }

  public render() {
    const {
      dismissNotification,
      showNotification,
      sortedNotifications,
    } = this.props;

    const { notificationsMinimized } = this.state;

    return (
      <div className={css.outer}>
        <BreadcrumbsItem to="/">Alchemy</BreadcrumbsItem>

        <div className={css.container}>
          <Route path="/" render={ ( props ) => ( props.location.pathname !== "/") && <HeaderContainer {...props} /> } />

          <Switch>
            <Route path="/dao/:daoAvatarAddress" component={ViewDaoContainer} />
            <Route exact={true} path="/daos" component={DaoListContainer} />
            <Route path="/profile/:accountAddress" component={AccountProfileContainer} />
            <Route path="/" component={HomeContainer} />
          </Switch>
          <ModalRoute
            path="/dao/:daoAvatarAddress/proposals/create"
            parentPath={(route: any) => `/dao/${route.params.daoAvatarAddress}`}
            component={CreateProposalContainer}
          />
          <ModalContainer
            modalClassName={css.modal}
            backdropClassName={css.backdrop}
            containerClassName={css.modalContainer}
            bodyModalClassName={css.modalBody}
          />
        </div>
        <div className={css.pendingTransactions}>
          {notificationsMinimized ?
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

export default connect(mapStateToProps, mapDispatchToProps)(withCookies(AppContainer));
