import * as Arc from '@daostack/arc.js';
import axios from "axios";
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Route, Switch } from "react-router-dom";
import { bindActionCreators } from "redux";

import { IRootState } from "reducers";
import { IArcState } from "reducers/arcReducer";
import { ConnectionStatus, IWeb3State } from "reducers/web3Reducer";
import store from "../configureStore";

import * as web3Actions from 'actions/web3Actions';
import * as arcActions from "actions/arcActions";
import * as operationsActions from 'actions/operationsActions';

import CreateDaoContainer from "components/CreateDao/CreateDaoContainer";
import Notification from "components/Notification/Notification";
import CreateProposalContainer from "components/CreateProposal/CreateProposalContainer";
import NoEthAccountContainer from "components/Errors/NoEthAccountContainer";
import NoWeb3Container from "components/Errors/NoWeb3Container";
import HomeContainer from "components/Home/HomeContainer";
import ViewDaoContainer from "components/ViewDao/ViewDaoContainer";
import HeaderContainer from "layouts/HeaderContainer";

import * as css from "./App.scss";
import { IOperationsState } from 'reducers/operations';

interface IStateProps {
  arc: IArcState;
  connectionStatus: ConnectionStatus;
  ethAccountAddress: string | null;
  operations: IOperationsState,
}

const mapStateToProps = (state: IRootState, ownProps: any) => ({
  arc: state.arc,
  connectionStatus: state.web3.connectionStatus,
  ethAccountAddress: state.web3.ethAccountAddress,
  operations: state.operations,
});

interface IDispatchProps {
  changeAccount: typeof web3Actions.changeAccount;
  dismissOperation: typeof operationsActions.dismissOperation;
  initializeWeb3: typeof web3Actions.initializeWeb3;
  loadCachedState: typeof arcActions.loadCachedState;
}

const mapDispatchToProps = {
  changeAccount: web3Actions.changeAccount,
  dismissOperation: operationsActions.dismissOperation,
  initializeWeb3: web3Actions.initializeWeb3,
  loadCachedState: arcActions.loadCachedState,
};

type IProps = IStateProps & IDispatchProps;

class AppContainer extends React.Component<IProps, null> {
  public accountInterval: any;

  constructor(props: IProps) {
    super(props);
  }

  public async componentDidMount() {
    const { initializeWeb3, loadCachedState } = this.props;
    initializeWeb3();

    // If not using local testnet then load cached blockchain data from S3
    if (Arc.ConfigService.get('network') !== 'ganache') {
      loadCachedState();
    }
  }

  public componentWillReceiveProps(props: IProps) {
    // If we are connected to an account through web3
    if (props.ethAccountAddress) {
      // Setup an interval to check for the account to change (e.g. via MetaMask)
      // First clear the old interval
      if (this.accountInterval) {
        clearInterval(this.accountInterval);
      }

      this.accountInterval = setInterval(async function (accountAddress: string) {
        const newAccount = await Arc.Utils.getDefaultAccount();
        if (newAccount !== accountAddress) {
          this.props.changeAccount(newAccount);
        }
      }.bind(this, props.ethAccountAddress), 400);
    }
  }

  public render() {
    const { connectionStatus, operations, ethAccountAddress, dismissOperation } = this.props;

    return (
      (connectionStatus === ConnectionStatus.Pending
        ? <div className={css.loading}>Loading...</div>
        : connectionStatus === ConnectionStatus.Failed
          ? <NoWeb3Container />
          : ethAccountAddress === null
            ? <NoEthAccountContainer />
            : connectionStatus == ConnectionStatus.Connected
              ? <div className={css.outer}>
                <div className={css.container}>
                  <Route path="/dao/:daoAddress" children={(props) => (
                    <HeaderContainer daoAddress={props.match ? props.match.params.daoAddress : null} />
                  )} />
                  <Switch>
                    <Route exact path="/" component={HomeContainer} />
                    <Route exact path="/dao/create" component={CreateDaoContainer} />
                    <Route path="/dao/:daoAddress" component={ViewDaoContainer} />
                    <Route exact path="/proposal/create/:daoAddress" component={CreateProposalContainer} />
                  </Switch>
                </div>
                <div className={css.pendingTransactions}>
                  {Object.keys(operations).map((k) =>
                    <div key={k}>
                      <Notification
                        operation={operations[k]}
                        close={() => dismissOperation(k)}
                      />
                      <br />
                    </div>

                  )}

                  {/* <div className={css.pendingTransaction + " " + css.clearfix + " " + css.error}>
                    <div className={css.statusIcon}>
                      <img className={css.pending} src="/assets/images/Icon/Loading-white.svg" />
                      <img className={css.success} src="/assets/images/Icon/Success-notification.svg" />
                      <img className={css.error} src="/assets/images/Icon/Error-notification.svg" />
                    </div>
                    <div className={css.transactionMessage}>
                      <div className={css.clearfix}>
                        <div className={css.left}>
                          <span className={css.pending}>PENDING TRANSACTION</span>
                          <span className={css.success}>TRANSACTION SUCCESSFUL</span>
                          <span className={css.error}>TRANSACTION FAILED</span>
                        </div>
                        <div className={css.right}>
                          <span className={css.pending}>1 OF 1</span>
                          <span className={css.success}>1 OF 1</span>
                          <span className={css.error}>ERROR</span>
                        </div>
                      </div>
                      <div className={css.notificationMessage}>
                        <span>Fail stake on <a href="#">DAOstack meetup</a></span>
                      </div>
                    </div>
                    <div className={css.notificationControls}>
                      <button className={css.pending}><img src="/assets/images/Icon/Minimize-notification.svg" /></button>
                      <button className={css.success}><img src="/assets/images/Icon/Close.svg" /></button>
                      <button className={css.error}><img src="/assets/images/Icon/Close.svg" /></button>
                    </div>
                  </div>

                  <br />

                  <div className={css.pendingTransaction + " " + css.clearfix + " " + css.pending + " " + css.minimized}>
                    <div className={css.statusIcon}>
                      <img className={css.pending} src="/assets/images/Icon/Loading-white.svg" />
                      <img className={css.success} src="/assets/images/Icon/Success-notification.svg" />
                      <img className={css.error} src="/assets/images/Icon/Error-notification.svg" />
                    </div>
                    <div className={css.transactionMessage}>
                      <div className={css.clearfix}>
                        <div className={css.left}>
                          <span className={css.pending}>PENDING TRANSACTION</span>
                          <span className={css.success}>TRANSACTION SUCCESSFUL</span>
                          <span className={css.error}>TRANSACTION FAILED</span>
                        </div>
                        <div className={css.right}>
                          <span className={css.pending}>1 OF 1</span>
                          <span className={css.success}>1 OF 1</span>
                          <span className={css.error}>ERROR</span>
                        </div>
                      </div>
                      <div className={css.notificationMessage}>
                        <span>Fail stake on <a href="#">DAOstack meetup</a></span>
                      </div>
                    </div>
                    <div className={css.notificationControls}>
                      <button className={css.pending}><img src="/assets/images/Icon/Minimize-notification.svg" /></button>
                      <button className={css.success}><img src="/assets/images/Icon/Close.svg" /></button>
                      <button className={css.error}><img src="/assets/images/Icon/Close.svg" /></button>
                    </div>
                  </div>

                  <br />

                  <div className={css.pendingTransaction + " " + css.clearfix + " " + css.success}>
                    <div className={css.statusIcon}>
                      <img className={css.pending} src="/assets/images/Icon/Loading-white.svg" />
                      <img className={css.success} src="/assets/images/Icon/Success-notification.svg" />
                      <img className={css.error} src="/assets/images/Icon/Error-notification.svg" />
                    </div>
                    <div className={css.transactionMessage}>
                      <div className={css.clearfix}>
                        <div className={css.left}>
                          <span className={css.pending}>PENDING TRANSACTION</span>
                          <span className={css.success}>TRANSACTION SUCCESSFUL</span>
                          <span className={css.error}>TRANSACTION FAILED</span>
                        </div>
                        <div className={css.right}>
                          <span className={css.pending}>1 OF 1</span>
                          <span className={css.success}>1 OF 1</span>
                          <span className={css.error}>ERROR</span>
                        </div>
                      </div>
                      <div className={css.notificationMessage}>
                        <span>Fail stake on <a href="#">Travel, hotels and registration for Denver Eth</a></span>
                      </div>
                    </div>
                    <div className={css.notificationControls}>
                      <button className={css.pending}><img src="/assets/images/Icon/Minimize-notification.svg" /></button>
                      <button className={css.success}><img src="/assets/images/Icon/Close.svg" /></button>
                      <button className={css.error}><img src="/assets/images/Icon/Close.svg" /></button>
                    </div>
                  </div>

                  <br />

                  <div className={css.pendingTransaction + " " + css.clearfix + " " + css.pending}>
                    <div className={css.statusIcon}>
                      <img className={css.pending} src="/assets/images/Icon/Loading-white.svg" />
                      <img className={css.success} src="/assets/images/Icon/Success-notification.svg" />
                      <img className={css.error} src="/assets/images/Icon/Error-notification.svg" />
                    </div>
                    <div className={css.transactionMessage}>
                      <div className={css.clearfix}>
                        <div className={css.left}>
                          <span className={css.pending}>PENDING TRANSACTION</span>
                          <span className={css.success}>TRANSACTION SUCCESSFUL</span>
                          <span className={css.error}>TRANSACTION FAILED</span>
                        </div>
                        <div className={css.right}>
                          <span className={css.pending}>1 OF 1</span>
                          <span className={css.success}>1 OF 1</span>
                          <span className={css.error}>ERROR</span>
                        </div>
                      </div>
                      <div className={css.notificationMessage}>
                        <span>Vote on <a href="#">Consultants to help with explainer videos</a></span>
                      </div>
                    </div>
                    <div className={css.notificationControls}>
                      <button className={css.pending}><img src="/assets/images/Icon/Minimize-notification.svg" /></button>
                      <button className={css.success}><img src="/assets/images/Icon/Close.svg" /></button>
                      <button className={css.error}><img src="/assets/images/Icon/Close.svg" /></button>
                    </div>
                  </div>
 */}

                </div>
                <div className={css.background}></div>
              </div>
              : <div className={css.loading}>Something weird happened, please contact the DAOstack team...</div>
      )
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AppContainer);
