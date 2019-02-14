import * as History from "history";
import * as queryString from "query-string";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { Cookies, withCookies } from "react-cookie";
import { connect } from "react-redux";
import { Route, Switch } from "react-router-dom";
//@ts-ignore
import { ModalContainer, ModalRoute } from "react-router-modal";

import { getArc, pollForAccountChanges } from 'arc'
import { Address } from '@daostack/client'
import * as arcActions from "actions/arcActions";
import * as web3Actions from "actions/web3Actions";
import AccountProfileContainer from "components/Account/AccountProfileContainer";
import CreateProposalContainer from "components/CreateProposal/CreateProposalContainer";
import DaoListContainer from "components/DaoList/DaoListContainer";
import NoEthAccountContainer from "components/Errors/NoEthAccountContainer";
import NoWeb3Container from "components/Errors/NoWeb3Container";
import HomeContainer from "components/Home/HomeContainer";
import MinimizedNotifications from "components/Notification/MinimizedNotifications";
import Notification, { NotificationViewStatus } from "components/Notification/Notification";
import ViewDaoContainer from "components/ViewDao/ViewDaoContainer";
import HeaderContainer from "layouts/HeaderContainer";
import { IRootState } from "reducers";
import { dismissNotification, INotificationsState, NotificationStatus, showNotification } from "reducers/notifications";
import { ConnectionStatus } from "reducers/web3Reducer";
import { sortedNotifications } from "../selectors/notifications";
import * as css from "./App.scss";

interface IStateProps {
  connectionStatus: ConnectionStatus;
  cookies: Cookies;
  ethAccountAddress: string | null;
  history: History.History;
  lastBlock: number;
  sortedNotifications: INotificationsState;
}

const mapStateToProps = (state: IRootState, ownProps: any) => ({
  connectionStatus: state.web3.connectionStatus,
  ethAccountAddress: state.web3.ethAccountAddress,
  history: ownProps.history,
  lastBlock: state.arc.lastBlock,
  sortedNotifications: sortedNotifications()(state),
});

interface IDispatchProps {
  dismissNotification: typeof dismissNotification;
  setCurrentAccountAddress: typeof web3Actions.setCurrentAccountAddress;
  onRedeemReward: typeof arcActions.onRedeemReward;
  onProposalExecuted: typeof arcActions.onProposalExecuted;
  onStakeEvent: typeof arcActions.onStakeEvent;
  onVoteEvent: typeof arcActions.onVoteEvent;
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  dismissNotification,
  setCurrentAccountAddress: web3Actions.setCurrentAccountAddress,
  onProposalExecuted: arcActions.onProposalExecuted,
  onRedeemReward: arcActions.onRedeemReward,
  onStakeEvent: arcActions.onStakeEvent,
  onVoteEvent: arcActions.onVoteEvent,
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
    const arc = getArc()

    // if we cahnge the acount, notify the redux store that we did so
    pollForAccountChanges(arc.web3).subscribe(
      (next: Address) => {
        this.props.setCurrentAccountAddress(next)
      }
    )

    // await initializeWeb3();
  }

  public render() {
    const {
      connectionStatus,
      dismissNotification,
      showNotification,
      ethAccountAddress,
      sortedNotifications,
    } = this.props;

    const { notificationsMinimized } = this.state;

    return (
      // (connectionStatus === ConnectionStatus.Pending ?
      //   <div className={css.loading}>Waiting for ethereum connection...</div> :
      // connectionStatus === ConnectionStatus.Failed ?
      //   <NoWeb3Container /> :
      // ethAccountAddress === null ?
      //   <NoEthAccountContainer /> :
      // connectionStatus === ConnectionStatus.Connected ?
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
      // :
      //   <div className={css.loading}>Something weird happened, please contact the DAOstack team...</div>
      // )
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withCookies(AppContainer));
