import {Address } from "@daostack/client";
import * as web3Actions from "actions/web3Actions";
import { getArc, getCurrentUser, pollForAccountChanges } from "arc";
import AccountProfileContainer from "components/Account/AccountProfileContainer";
import CreateProposalContainer from "components/CreateProposal/CreateProposalContainer";
import CreateSchemeRegistrarProposal from "components/CreateProposal/CreateSchemeRegistrarProposal";
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
import { ModalContainer, ModalRoute } from "react-router-modal";
import { IRootState } from "reducers";
import { dismissNotification, INotificationsState, NotificationStatus, showNotification } from "reducers/notifications";
import { ConnectionStatus } from "reducers/web3Reducer";
import { sortedNotifications } from "../selectors/notifications";
import * as css from "./App.scss";

interface IStateProps {
  connectionStatus: ConnectionStatus;
  cookies: Cookies;
  currentAccountAddress: string;
  history: History.History;
  sortedNotifications: INotificationsState;
}

const mapStateToProps = (state: IRootState, ownProps: any) => ({
  connectionStatus: state.web3.connectionStatus,
  currentAccountAddress: state.web3.ethAccountAddress,
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

  public async componentDidMount() {
    // get the Arc object as early the lifetime of the app
    const arc = getArc();
    let currentAddress: Address;
    try {
      // only set the account if the network is correct
      // TODO: display big error if not on correct network
      currentAddress = await getCurrentUser();
      console.log( `current address`, currentAddress);
      if (this.props.currentAccountAddress !== currentAddress) {
        this.props.setCurrentAccount(currentAddress);
      }

      pollForAccountChanges(arc.web3, currentAddress).subscribe(
        (newAddress: Address) => {
          if (currentAddress !== newAddress) {
            this.props.setCurrentAccount(undefined);
            window.location.reload();
          }
        }
      );
    } catch (err) {
      console.warn(err.message);
      this.props.setCurrentAccount(undefined);
      if (err.message.match(/no metamask/i)) {
        // if no metamask instance is found, we do not bother the user (yet)
      } else {
        this.props.showNotification(NotificationStatus.Failure, err.message);
      }
    }
  }

  public render() {
    const {
      connectionStatus,
      dismissNotification,
      showNotification,
      sortedNotifications,
    } = this.props;

    const { notificationsMinimized } = this.state;

    return (
      <div className={css.outer}>
        <BreadcrumbsItem to="/">Alchemy</BreadcrumbsItem>

        { connectionStatus === ConnectionStatus.Pending ? <div>Checking connection status...</div> :
          <div className={css.container}>
            <Route path="/"
              render={ ( props ) => ( props.location.pathname !== "/") && <HeaderContainer {...props} /> } />

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
            <ModalRoute
              path="/dao/:daoAvatarAddress/proposals/create/SchemeRegistrar"
              parentPath={(route: any) => `/dao/${route.params.daoAvatarAddress}`}
              component={CreateSchemeRegistrarProposal}
            />
            <ModalContainer
              modalClassName={css.modal}
              backdropClassName={css.backdrop}
              containerClassName={css.modalContainer}
              bodyModalClassName={css.modalBody}
            />
          </div>
        }
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
