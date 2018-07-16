import * as Arc from '@daostack/arc.js';
import axios from "axios";
import * as History from "history";
import * as React from "react";
import { withCookies, Cookies } from 'react-cookie';
import { connect, Dispatch } from "react-redux";
import { Route, Switch } from "react-router-dom";
import { replace as routerReplace } from "react-router-redux";
import { bindActionCreators } from "redux";

import { IRootState } from "reducers";
import { IArcState } from "reducers/arcReducer";
import { ConnectionStatus, IWeb3State } from "reducers/web3Reducer";
import store from "../configureStore";

import * as web3Actions from 'actions/web3Actions';
import * as arcActions from "actions/arcActions";

import CreateDaoContainer from "components/CreateDao/CreateDaoContainer";
import Notification, { NotificationViewStatus } from "components/Notification/Notification";
import CreateProposalContainer from "components/CreateProposal/CreateProposalContainer";
import DaoListContainer from "components/DaoList/DaoListContainer";
import NoEthAccountContainer from "components/Errors/NoEthAccountContainer";
import NoWeb3Container from "components/Errors/NoWeb3Container";
import HomeContainer from "components/Home/HomeContainer";
import ViewDaoContainer from "components/ViewDao/ViewDaoContainer";
import HeaderContainer from "layouts/HeaderContainer";
//@ts-ignore
import { ModalContainer, ModalRoute } from 'react-router-modal';

import * as css from "./App.scss";
import { sortedNotifications } from '../selectors/notifications';
import { dismissNotification, NotificationStatus, INotificationsState, showNotification } from 'reducers/notifications';
import { OperationStatus, OperationError } from 'reducers/operations';

interface IStateProps {
  arc: IArcState;
  connectionStatus: ConnectionStatus;
  cookies: Cookies;
  ethAccountAddress: string | null;
  history: History.History;
  sortedNotifications: INotificationsState;
}

const mapStateToProps = (state: IRootState, ownProps: any) => ({
  arc: state.arc,
  connectionStatus: state.web3.connectionStatus,
  ethAccountAddress: state.web3.ethAccountAddress,
  history: ownProps.history,
  sortedNotifications: sortedNotifications()(state),
});

interface IDispatchProps {
  dismissNotification: typeof dismissNotification;
  showNotification: typeof showNotification;
  initializeWeb3: typeof web3Actions.initializeWeb3;
  loadCachedState: typeof arcActions.loadCachedState;
}

const mapDispatchToProps = {
  dismissNotification,
  showNotification,
  initializeWeb3: web3Actions.initializeWeb3,
  loadCachedState: arcActions.loadCachedState,
};

type IProps = IStateProps & IDispatchProps;

class AppContainer extends React.Component<IProps, null> {

  constructor(props: IProps) {
    super(props);
  }

  public async componentWillMount() {
    const { cookies, history } = this.props;

    // If this person has not seen the disclaimer, show them the home page
    if (!cookies.get('seen_disclaimer')) {
      cookies.set('seen_disclaimer', "true", { path: '/' });
      history.replace("/");
    }
  }

  public async componentDidMount() {
    const { initializeWeb3, loadCachedState } = this.props;
    initializeWeb3();

    // If not using local testnet then load cached blockchain data from S3
    if ((await Arc.Utils.getNetworkName()) !== 'Ganache') {
      loadCachedState();
    }
  }

  public render() {
    const {
      connectionStatus,
      cookies,
      dismissNotification,
      showNotification,
      ethAccountAddress,
      sortedNotifications
    } = this.props;

    return (
      (connectionStatus === ConnectionStatus.Pending ?
        <div className={css.loading}>Loading...</div> :
      connectionStatus === ConnectionStatus.Failed ?
        <NoWeb3Container /> :
      ethAccountAddress === null ?
        <NoEthAccountContainer /> :
      connectionStatus == ConnectionStatus.Connected ?
        <div className={css.outer}>
          <div className={css.container}>
            <Route path="/dao/:daoAddress" children={(props) => (
              <HeaderContainer daoAddress={props.match ? props.match.params.daoAddress : null} />
            )} />
            <Switch>
              <Route path="/dao/:daoAddress" component={ViewDaoContainer} />
              <Route exact path="/daos" component={DaoListContainer}/>
              <Route path="/" component={HomeContainer} />
            </Switch>
            <ModalRoute
              exact
              path='/create-dao'
              parentPath='/'
              component={CreateDaoContainer}
            />
            <ModalRoute
              path='/dao/:daoAddress/proposals/create'
              parentPath={(route: any) => `/dao/${route.params.daoAddress}`}
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
            {sortedNotifications.map(({id, status, title, message, fullErrorMessage, timestamp, url}) => (
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
                  />
                <br/>
              </div>
            ))}
          </div>
          <div className={css.background}></div>
        </div>
      :
        <div className={css.loading}>Something weird happened, please contact the DAOstack team...</div>
      )
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withCookies(AppContainer));
