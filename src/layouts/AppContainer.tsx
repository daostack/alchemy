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
import { IArcState, RewardType } from "reducers/arcReducer";
import { ConnectionStatus, IWeb3State } from "reducers/web3Reducer";

import * as web3Actions from 'actions/web3Actions';
import * as arcActions from "actions/arcActions";
import Util from "lib/util";

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
import MinimizedNotifications from 'components/Notification/MinimizedNotifications';

interface IStateProps {
  connectionStatus: ConnectionStatus;
  cookies: Cookies;
  daosLoaded: boolean;
  ethAccountAddress: string | null;
  history: History.History;
  lastBlock: number;
  sortedNotifications: INotificationsState;
}

const mapStateToProps = (state: IRootState, ownProps: any) => ({
  connectionStatus: state.web3.connectionStatus,
  daosLoaded: state.arc.daosLoaded,
  ethAccountAddress: state.web3.ethAccountAddress,
  history: ownProps.history,
  lastBlock: state.arc.lastBlock,
  sortedNotifications: sortedNotifications()(state),
});

interface IDispatchProps {
  dismissNotification: typeof dismissNotification;
  getDAOs: typeof arcActions.getDAOs;
  initializeWeb3: typeof web3Actions.initializeWeb3;
  loadCachedState: typeof arcActions.loadCachedState;
  onRedeemReward: typeof arcActions.onRedeemReward;
  onProposalCreateEvent: typeof arcActions.onProposalCreateEvent;
  onProposalExecuted: typeof arcActions.onProposalExecuted;
  onStakeEvent: typeof arcActions.onStakeEvent;
  onVoteEvent: typeof arcActions.onVoteEvent;
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  dismissNotification,
  getDAOs: arcActions.getDAOs,
  initializeWeb3: web3Actions.initializeWeb3,
  loadCachedState: arcActions.loadCachedState,
  onRedeemReward: arcActions.onRedeemReward,
  onProposalCreateEvent: arcActions.onProposalCreateEvent,
  onProposalExecuted: arcActions.onProposalExecuted,
  onStakeEvent: arcActions.onStakeEvent,
  onVoteEvent: arcActions.onVoteEvent,
  showNotification,
};

type IProps = IStateProps & IDispatchProps;

interface IState {
  notificationsMinimized: boolean;
}

class AppContainer extends React.Component<IProps, IState> {
  public watchers: Array<Arc.EventFetcher<any> | Arc.EntityFetcher<any, any>> = []

  constructor(props: IProps) {
    super(props);
    this.state = { notificationsMinimized: false };
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
    const { daosLoaded, getDAOs, initializeWeb3, loadCachedState } = this.props;
    await initializeWeb3();

    // If not using local testnet then load cached blockchain data from S3
    if ((await Arc.Utils.getNetworkName()) !== 'Ganache') {
      await loadCachedState();
    } else {
      if (!daosLoaded) {
        await getDAOs();
      }
    }

    await this.setupWatchers();
  }

   public async componentDidUpdate(prevProps: IProps) {
    if (this.props.daosLoaded && !prevProps.daosLoaded) {
      // If DAOs just finally loaded then setup the watchers
      await this.setupWatchers();
    }
  }

  public async setupWatchers() {
    // Check if already setup
    if (this.watchers.length || !this.props.daosLoaded) {
      return;
    }

    const {
      daosLoaded,
      lastBlock,
      onProposalCreateEvent,
      onProposalExecuted,
      onRedeemReward,
      onStakeEvent,
      onVoteEvent,
    } = this.props;

    // OK we're loaded up and ready to roll! Now start watching for new events
    // TODO: handle DAOs with different voting machine contracts (do this separately for each DAO?)
    const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
    const votingMachineInstance = await Arc.GenesisProtocolFactory.deployed();

    // Watch for new, confirmed proposals coming in
    const proposalEventWatcher = contributionRewardInstance.NewContributionProposal({}, { fromBlock: lastBlock });
    proposalEventWatcher.watch((error, result: Arc.DecodedLogEntryEvent<Arc.NewContributionProposalEventResult>) => {
      onProposalCreateEvent(result.args);
    }, -1);
    this.watchers.push(proposalEventWatcher);

    const executeProposalEventWatcher = votingMachineInstance.ExecutedProposals({}, { fromBlock: lastBlock });
    executeProposalEventWatcher.watch((error, result) => {
      const { avatarAddress, proposalId, decision, totalReputation, executionState } = result;
      onProposalExecuted(avatarAddress, proposalId, executionState, Number(decision), Util.fromWei(totalReputation));
    }, -1);
    this.watchers.push(executeProposalEventWatcher);

    const stakeEventWatcher = votingMachineInstance.Stake({ }, { fromBlock: lastBlock });
    stakeEventWatcher.watch((error: Error, result: Arc.DecodedLogEntryEvent<Arc.StakeEventResult>) => {
      onStakeEvent(result.args._avatar, result.args._proposalId, result.args._staker, Number(result.args._vote), Util.fromWei(result.args._amount));
    }, -1);
    this.watchers.push(stakeEventWatcher);

    const voteEventWatcher = votingMachineInstance.VoteProposal({ }, { fromBlock: lastBlock });
    voteEventWatcher.watch((error, result: Arc.DecodedLogEntryEvent<Arc.VoteProposalEventResult>) => {
      onVoteEvent(result.args._avatar, result.args._proposalId, result.args._voter, Number(result.args._vote), Util.fromWei(result.args._reputation));
    }, -1);
    this.watchers.push(voteEventWatcher);

    // ContributionReward redemptions
    const redeemEth = contributionRewardInstance.RedeemEther({}, { fromBlock: lastBlock });
    redeemEth.watch((err, result) => {
      const { _beneficiary, _avatar, _proposalId, _amount } = result.args;
      onRedeemReward(_avatar, _proposalId, _beneficiary, RewardType.Eth, true);
    }, -1);
    this.watchers.push(redeemEth);

    const redeemGen = contributionRewardInstance.RedeemExternalToken({}, { fromBlock: lastBlock });
    redeemGen.watch((err, result) => {
      const { _beneficiary, _avatar, _proposalId, _amount } = result.args;
      onRedeemReward(_avatar, _proposalId, _beneficiary, RewardType.ExternalToken, true);
    }, -1);
    this.watchers.push(redeemGen);

    const redeemToken = contributionRewardInstance.RedeemNativeToken({}, { fromBlock: lastBlock });
    redeemToken.watch((err, result) => {
      const { _beneficiary, _avatar, _proposalId, _amount } = result.args;
      onRedeemReward(_avatar, _proposalId, _beneficiary, RewardType.NativeToken, true);
    }, -1);
    this.watchers.push(redeemToken);

    const redeemRep = contributionRewardInstance.RedeemReputation({}, { fromBlock: lastBlock });
    redeemRep.watch((err, result) => {
      const { _beneficiary, _avatar, _proposalId, _amount } = result.args;
      onRedeemReward(_avatar, _proposalId, _beneficiary, RewardType.Reputation, true);
    }, -1);
    this.watchers.push(redeemRep);

    // GenesisProtocol Redemptions
    const redeem = votingMachineInstance.Redeem({}, { fromBlock: lastBlock });
    redeem.watch((err, result) => {
      const { _beneficiary, _avatar, _proposalId, _amount } = result.args;
      onRedeemReward(_avatar, _proposalId, _beneficiary, RewardType.GEN, false);
    }, -1);
    this.watchers.push(redeem);

    const redeemDaoBounty = votingMachineInstance.RedeemDaoBounty({}, { fromBlock: lastBlock });
    redeemDaoBounty.watch((err, result) => {
      const { _beneficiary, _avatar, _proposalId, _amount } = result.args;
      onRedeemReward(_avatar, _proposalId, _beneficiary, RewardType.BountyGEN, false);
    }, -1);
    this.watchers.push(redeemDaoBounty);

    const redeemRepGP = votingMachineInstance.RedeemReputation({}, { fromBlock: lastBlock });
    redeemRepGP.watch((err, result) => {
      const { _beneficiary, _avatar, _proposalId, _amount } = result.args;
      onRedeemReward(_avatar, _proposalId, _beneficiary, RewardType.Reputation, false);
    }, -1);
    this.watchers.push(redeemRepGP);
  }

 public componentWillUnmount() {
    this.watchers.forEach((watch) => {
      watch.stopWatching();
    })
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

    const { notificationsMinimized } = this.state;

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
            <Route path="/dao/:daoAvatarAddress" children={(props) => (
              <HeaderContainer daoAvatarAddress={props.match ? props.match.params.daoAvatarAddress : null} />
            )} />
            <Switch>
              <Route path="/dao/:daoAvatarAddress" component={ViewDaoContainer} />
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
              path='/dao/:daoAvatarAddress/proposals/create'
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
      :
        <div className={css.loading}>Something weird happened, please contact the DAOstack team...</div>
      )
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withCookies(AppContainer));
