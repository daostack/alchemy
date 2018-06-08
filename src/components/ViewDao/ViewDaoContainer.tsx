import * as Arc from "@daostack/arc.js";
import * as classNames from "classnames";
import { denormalize } from "normalizr";
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link, Route, RouteComponentProps, Switch } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import Util from "lib/util";
import { IRootState } from "reducers";
import { IDaoState, IProposalState, IRedemptionState } from "reducers/arcReducer";
import * as selectors from "selectors/daoSelectors";
import * as schemas from "../../schemas";

import ViewProposalContainer from "components/Proposal/ViewProposalContainer";
import DaoHeader from "./DaoHeader";
import DaoHistoryContainer from "./DaoHistoryContainer";
import DaoMembersContainer from "./DaoMembersContainer";
import DaoNav from "./DaoNav";
import DaoProposalsContainer from "./DaoProposalsContainer";
import DaoRedemptionsContainer from "./DaoRedemptionsContainer";
import promisify = require("es6-promisify");

import * as css from "./ViewDao.scss";

interface IStateProps extends RouteComponentProps<any> {
  currentAccountAddress: string;
  dao: IDaoState;
  daoAddress: string;
  numRedemptions: number;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  const dao = denormalize(state.arc.daos[ownProps.match.params.daoAddress], schemas.daoSchema, state.arc) as IDaoState;
  let numRedemptions = 0;

  if (dao && dao.members[state.web3.ethAccountAddress]) {
    numRedemptions = Object.keys(dao.members[state.web3.ethAccountAddress].redemptions).length;
  }

  return {
    currentAccountAddress: state.web3.ethAccountAddress,
    dao,
    daoAddress : ownProps.match.params.daoAddress,
    numRedemptions,
  };
};

interface IDispatchProps {
  onStakeEvent: typeof arcActions.onStakeEvent;
  onVoteEvent: typeof arcActions.onVoteEvent;
  getDAO: typeof arcActions.getDAO;
  getProposal: typeof arcActions.getProposal;
  onTransferEvent: typeof arcActions.onTransferEvent;
  onReputationChangeEvent: typeof arcActions.onReputationChangeEvent;
  onProposalExecuted: typeof arcActions.onProposalExecuted;
  onDAOEthBalanceChanged: typeof arcActions.onDAOEthBalanceChanged;
  onDAOGenBalanceChanged: typeof arcActions.onDAOGenBalanceChanged;
}

const mapDispatchToProps = {
  onStakeEvent: arcActions.onStakeEvent,
  onVoteEvent: arcActions.onVoteEvent,
  getDAO: arcActions.getDAO,
  getProposal: arcActions.getProposal,
  onTransferEvent: arcActions.onTransferEvent,
  onReputationChangeEvent: arcActions.onReputationChangeEvent,
  onProposalExecuted: arcActions.onProposalExecuted,
  onDAOEthBalanceChanged: arcActions.onDAOEthBalanceChanged,
  onDAOGenBalanceChanged: arcActions.onDAOGenBalanceChanged,
};

type IProps = IStateProps & IDispatchProps;

class ViewDaoContainer extends React.Component<IProps, null> {
  public proposalEventWatcher: Arc.EventFetcher<Arc.NewContributionProposalEventResult>;
  public stakeEventWatcher: Arc.EventFetcher<Arc.StakeEventResult>;
  public voteEventWatcher: Arc.EventFetcher<Arc.VoteProposalEventResult>;
  public executeProposalEventWatcher: Arc.EventFetcher<Arc.GenesisProtocolExecuteProposalEventResult>;
  public balanceWatcher: any;
  public transferEventWatcher: any;
  public mintEventWatcher: any;
  public burnEventWatcher: any;

  public async componentDidMount() {
    const {
      onStakeEvent,
      onVoteEvent ,
      currentAccountAddress,
      daoAddress,
      dao,
      getDAO,
      getProposal,
      onTransferEvent,
      onReputationChangeEvent,
      onProposalExecuted,
      onDAOEthBalanceChanged,
      onDAOGenBalanceChanged
    } = this.props;
    const web3 = await Arc.Utils.getWeb3();

    // TODO: we should probably always load the up to date DAO data, but this is kind of a hack
    //       to make sure we dont overwrite all proposals after creating an unconfirmed proposal
    //       and coming back to this page. This should be handled by better merging in the reducer.
    if (!dao || !dao.proposalsLoaded) {
      await getDAO(daoAddress);
    }

    // Watch for new, confirmed proposals coming in
    const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
    this.proposalEventWatcher = contributionRewardInstance.NewContributionProposal({ _avatar: daoAddress }, { fromBlock: "latest" });
    this.proposalEventWatcher.watch((error, result) => {
      getProposal(daoAddress, result[0].args._proposalId);
    });

    // Watch for new, confirmed stakes coming in for the current account
    // TODO: watch for all new stakes from anyone?
    const genesisProtocolInstance = await Arc.GenesisProtocolFactory.deployed();
    this.stakeEventWatcher = genesisProtocolInstance.Stake({ }, { fromBlock: "latest" });
    this.stakeEventWatcher.watch((error, result) => {
      onStakeEvent(daoAddress, result[0].args._proposalId, result[0].args._voter, Number(result[0].args._vote), Util.fromWei(result[0].args._amount).toNumber());
    });

    this.voteEventWatcher = genesisProtocolInstance.VoteProposal({ }, { fromBlock: "latest" });
    this.voteEventWatcher.watch((error, result) => {
      onVoteEvent(daoAddress, result[0].args._proposalId, result[0].args._voter, Number(result[0].args._vote), Util.fromWei(result[0].args._reputation).toNumber());
    });

    const daoInstance = await Arc.DAO.at(daoAddress);

    this.transferEventWatcher = daoInstance.token.Transfer({}, { fromBlock: "latest" });
    this.transferEventWatcher.watch((error: any, result: any) => {
      onTransferEvent(daoAddress, result.args.from, result.args.to);
    });

    this.mintEventWatcher = daoInstance.reputation.Mint({}, { fromBlock: "latest" });
    this.mintEventWatcher.watch((error: any, result: any) => {
      onReputationChangeEvent(daoAddress, result.args._to);
    });

    this.burnEventWatcher = daoInstance.reputation.Burn({}, { fromBlock: "latest" });
    this.burnEventWatcher.watch((error: any, result: any) => {
      onReputationChangeEvent(daoAddress, result.args._from);
    });

    this.executeProposalEventWatcher = genesisProtocolInstance.ExecuteProposal({}, { fromBlock: "latest" });
    this.executeProposalEventWatcher.watch((error, result) => {
      const { _proposalId, _executionState, _decision, _totalReputation } = result[0].args;
      onProposalExecuted(daoAddress, _proposalId, Number(_executionState), Number(_decision), Number(_totalReputation));
    });

    const votingMachineInstance = await Arc.GenesisProtocolFactory.deployed();
    const stakingTokenAddress = await votingMachineInstance.contract.stakingToken();
    const stakingToken = await (await Arc.Utils.requireContract("StandardToken")).at(stakingTokenAddress) as any;

    this.balanceWatcher = web3.eth.filter('latest');
    this.balanceWatcher.watch(async (err: any, res: any) => {
      if (!err && res) {
        const newEthBalance = Util.fromWei(await promisify(web3.eth.getBalance)(daoAddress)).toNumber();
        onDAOEthBalanceChanged(daoAddress, newEthBalance);
        const newGenBalance = Util.fromWei(await stakingToken.balanceOf(daoAddress)).toNumber();
        onDAOGenBalanceChanged(daoAddress, newGenBalance);
      }
    })
  }

  public componentWillUnmount() {
    if (this.proposalEventWatcher) {
      this.proposalEventWatcher.stopWatching();
    }

    if (this.stakeEventWatcher) {
      this.stakeEventWatcher.stopWatching();
    }

    if (this.voteEventWatcher) {
      this.voteEventWatcher.stopWatching();
    }

    if (this.transferEventWatcher) {
      this.transferEventWatcher.stopWatching();
    }

    if (this.mintEventWatcher) {
      this.mintEventWatcher.stopWatching();
    }

    if (this.burnEventWatcher) {
      this.burnEventWatcher.stopWatching();
    }

    if (this.executeProposalEventWatcher) {
      this.executeProposalEventWatcher.stopWatching();
    }

    if (this.balanceWatcher) {
      this.balanceWatcher.stopWatching();
    }
  }

  public render() {
    const { currentAccountAddress, dao, numRedemptions } = this.props;

    if (dao) {
      return(
        <div className={css.wrapper}>
          <DaoHeader dao={dao} />
          <DaoNav currentAccountAddress={currentAccountAddress} dao={dao} numRedemptions={numRedemptions} />

          <Switch>
            <Route exact path="/dao/:daoAddress/history" component={DaoHistoryContainer} />
            <Route exact path="/dao/:daoAddress/members" component={DaoMembersContainer} />
            <Route exact path="/dao/:daoAddress/redemptions" component={DaoRedemptionsContainer} />
            <Route exact path="/dao/:daoAddress/proposal/:proposalId" component={ViewProposalContainer} />
            <Route path="/dao/:daoAddress" component={DaoProposalsContainer} />
          </Switch>
        </div>
      );
    } else {
      return (<div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/></div>);
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewDaoContainer);
