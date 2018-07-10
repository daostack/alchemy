import * as Arc from "@daostack/arc.js";
import * as classNames from "classnames";
import { denormalize } from "normalizr";
import * as React from "react";
import { withCookies, Cookies } from 'react-cookie';
import Joyride from 'react-joyride';
import { connect, Dispatch } from "react-redux";
import { Link, Route, RouteComponentProps, Switch } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import * as uiActions from "actions/uiActions";
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
import * as appCss from "layouts/App.scss";
import * as proposalCss from "../Proposal/Proposal.scss";

interface IStateProps extends RouteComponentProps<any> {
  cookies: Cookies;
  currentAccountAddress: string;
  dao: IDaoState;
  daoAddress: string;
  numRedemptions: number;
  tourVisible: boolean;
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
    tourVisible: state.ui.tourVisible
  };
};

interface IDispatchProps {
  onStakeEvent: typeof arcActions.onStakeEvent;
  onVoteEvent: typeof arcActions.onVoteEvent;
  getDAO: typeof arcActions.getDAO;
  onProposalCreateEvent: typeof arcActions.onProposalCreateEvent;
  onTransferEvent: typeof arcActions.onTransferEvent;
  onReputationChangeEvent: typeof arcActions.onReputationChangeEvent;
  onProposalExecuted: typeof arcActions.onProposalExecuted;
  onDAOEthBalanceChanged: typeof arcActions.onDAOEthBalanceChanged;
  onDAOGenBalanceChanged: typeof arcActions.onDAOGenBalanceChanged;
  hideTour: typeof uiActions.hideTour;
  showTour: typeof uiActions.showTour;
}

const mapDispatchToProps = {
  onStakeEvent: arcActions.onStakeEvent,
  onVoteEvent: arcActions.onVoteEvent,
  getDAO: arcActions.getDAO,
  onProposalCreateEvent: arcActions.onProposalCreateEvent,
  onTransferEvent: arcActions.onTransferEvent,
  onReputationChangeEvent: arcActions.onReputationChangeEvent,
  onProposalExecuted: arcActions.onProposalExecuted,
  onDAOEthBalanceChanged: arcActions.onDAOEthBalanceChanged,
  onDAOGenBalanceChanged: arcActions.onDAOGenBalanceChanged,
  hideTour: uiActions.hideTour,
  showTour: uiActions.showTour,
};

type IProps = IStateProps & IDispatchProps;

interface IState {
  showTourIntro: boolean;
  showTourOutro: boolean;
  tourCount: number;
}

class ViewDaoContainer extends React.Component<IProps, IState> {
  public proposalEventWatcher: Arc.EventFetcher<Arc.NewContributionProposalEventResult>;
  public stakeEventWatcher: Arc.EventFetcher<Arc.StakeEventResult>;
  public voteEventWatcher: Arc.EventFetcher<Arc.VoteProposalEventResult>;
  public executeProposalEventWatcher: Arc.EventFetcher<Arc.GenesisProtocolExecuteProposalEventResult>;
  public balanceWatcher: any;
  public transferEventWatcher: any;
  public mintEventWatcher: any;
  public burnEventWatcher: any;

  constructor(props: IProps) {
    super(props);

    this.state = {
      showTourIntro: false,
      showTourOutro: false,
      tourCount: 0
    };
  }

  public async componentWillMount() {
    const { cookies, showTour } = this.props;

    // If this person has not seen the disclaimer, show them the home page
    if (!cookies.get('seen_tour')) {
      cookies.set('seen_tour', "true", { path: '/' });
      this.setState({ showTourIntro: true });
    }
  }

  public async componentDidMount() {
    const {
      onStakeEvent,
      onVoteEvent ,
      currentAccountAddress,
      daoAddress,
      dao,
      getDAO,
      onProposalCreateEvent,
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
      onProposalCreateEvent(result.args);
    });

    // Watch for new, confirmed stakes coming in for the current account
    // TODO: watch for all new stakes from anyone?
    const daoInstance = await Arc.DAO.at(daoAddress);
    const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(daoAddress)).votingMachineAddress;
    const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);

    this.stakeEventWatcher = votingMachineInstance.Stake({ }, { fromBlock: "latest" });
    this.stakeEventWatcher.watch((error, result) => {
      onStakeEvent(daoAddress, result.args._proposalId, result.args._voter, Number(result.args._vote), Util.fromWei(result.args._amount).toNumber());
    });

    this.voteEventWatcher = votingMachineInstance.VoteProposal({ }, { fromBlock: "latest" });
    this.voteEventWatcher.watch((error, result) => {
      onVoteEvent(daoAddress, result.args._proposalId, result.args._voter, Number(result.args._vote), Util.fromWei(result.args._reputation).toNumber());
    });

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

    this.executeProposalEventWatcher = votingMachineInstance.ExecuteProposal({}, { fromBlock: "latest" });
    this.executeProposalEventWatcher.watch((error, result) => {
      const { _proposalId, _executionState, _decision, _totalReputation } = result.args;
      onProposalExecuted(daoAddress, _proposalId, Number(_executionState), Number(_decision), Number(_totalReputation));
    });

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

  public handleClickStartTour = (e: any) => {
    const { showTour } = this.props;
    this.setState({ showTourIntro: false });
    showTour();
  };

  public handleClickSkipTour = (e: any) => {
    this.setState({ showTourIntro: false });
  };

  public handleClickEndTour = (e: any) => {
    this.setState({ showTourOutro: false });
  };

  public handleJoyrideCallback = (data: any) => {
    const { hideTour } = this.props;

    if (data.type == 'tour:end') {
      this.setState({
        showTourOutro: true,
        tourCount: this.state.tourCount + 1
      });
    }
    if (data.action == 'close' || data.type == 'tour:end') {
      hideTour();
    }
  };

  public render() {
    const { currentAccountAddress, dao, numRedemptions, tourVisible } = this.props;

    if (dao) {
      const tourSteps = [
        {
          target: "." + css.daoInfo,
          content: `Alchemy is used for making budget decisions within Genesis Alpha. Decisions are made by people who have been given reputation within it. ${dao.name} has ${Object.keys(dao.members).length} Members with ${Math.round(dao.reputationCount).toLocaleString()} Reputation`,
          placement: "right",
          disableBeacon: true
        },
        {
          target: "." + appCss.accountInfo,
          content: "Your wallet: Check here to see how much reputation you have and see your token balance",
          placement: "bottom",
          disableBeacon: true
        },
        {
          target: "." + css.holdings,
          content: "DAO Budget: Reputation holders collectively decide how to manage the DAO’s budget. The amount in ETH represents available budget for funding proposals. The GEN amount indicates how much the DAO has to reward voters and predictors.",
          placement: "left",
          disableBeacon: true
        },
        {
          target: "." + css.createProposal,
          content: "Create proposal: Do you have an initiative to improve DAOstack? Create a proposal to get it funded. If the proposal passes, the funds would be transferred to the target account automatically and you will be rewarded with additional reputation and GEN. If a proposal fails, there is no penalty for the proposer.",
          placement: "top",
          disableBeacon: true
        },
        {
          target: "." + proposalCss.voteControls,
          content: "Voting: If you have reputation in the DAO, you can vote on proposals. If your vote corresponds with the outcome of the proposal (You vote yes on a proposal that passes, or vote no on a proposal that fails), you will be rewarded with reputation and GEN.",
          placement: "right",
          disableBeacon: true
        },
        {
          target: "." + css.regularContainer,
          content: "Regular proposals: Regular proposals need at least a 50% majority to be approved or rejected by the DAO. If proposal closes (time runs out) before a regular proposal gets more than 50% yes votes, it will fail.",
          placement: "top",
          disableBeacon: true
        },
        {
          target: "." + css.boostedContainer,
          content: "Urgent proposals are called Boosted proposals. At the end of a three day voting period, the proposal will pass or fail depending on which side gets the most votes. Unlike regular proposals, there is no need for a 50% majority. Regular proposal become boosted proposal once enough GENs are used to predict they will pass.",
          placement: "top",
          disableBeacon: true
        },
        {
          target: "." + proposalCss.predictions,
          content: "Predictions: Influencing proposals isn’t limited to reputation holders only. Anyone can direct the attention of the DAO by using GEN to place a prediction whether a proposal will pass or fail. When enough GEN are placed in predicting a proposal will pass, it will become a boosted proposal. If you correctly predict the outcome of a proposal you will be rewarded with GEN and reputation.",
          placement: "left",
          disableBeacon: true
        }
      ];

      const tourModalClass = classNames({
        [css.tourModal]: true,
        [css.hidden]: !this.state.showTourIntro && !this.state.showTourOutro
      });

      const tourStartClass = classNames({
        [css.tourStart]: true,
        [css.hidden]: !this.state.showTourIntro
      });

      const tourEndClass = classNames({
        [css.tourEnd]: true,
        [css.hidden]: !this.state.showTourOutro
      });

      return(
        <div className={css.outer}>
          <div className={tourModalClass}>
            <div className={css.bg}></div>
            <div className={css.accessTour}>
              <button><img src="/assets/images/Tour/TourButton.svg"/></button>
              <div>Access the tour later! <img src="/assets/images/Tour/Arrow.svg"/></div>
            </div>
            <div className={tourStartClass}>
              <h1>Welcome to Alchemy!</h1>
              <span>Decentralized budgeting powered by <img src="/assets/images/Tour/DAOstackLogo.svg"/> DAOstack.</span>
              <p>New to Alchemy? Take this tour to learn how <strong>voting, reputation, predictions,</strong> and <strong>proposals</strong> work within Alchemy.</p>
              <div>
                <button onClick={this.handleClickSkipTour}><img src="/assets/images/Tour/SkipTour.svg"/> Skip the tour</button>
                <button className={css.startButton} onClick={this.handleClickStartTour}><img src="/assets/images/Tour/StartTour.svg"/> Start the tour</button>
              </div>
            </div>
            <div className={tourEndClass}>
              <h1>You’re done!</h1>
              <p>Thanks for taking the time to learn about Alchemy.
For additional information check out our <a href="https://docs.google.com/document/d/1M1erC1TVPPul3V_RmhKbyuFrpFikyOX0LnDfWOqO20Q/edit">FAQ</a> and our <a href="https://medium.com/daostack/new-introducing-alchemy-budgeting-for-decentralized-organizations-b81ba8501b23">Intro to Alchemy</a> blog post.</p>
              <button className={css.startButton} onClick={this.handleClickEndTour}><img src="/assets/images/Tour/StartTour.svg"/> Start using Alchemy</button>
            </div>
          </div>
          <Joyride
            callback={this.handleJoyrideCallback}
            continuous
            key={'joyride_' + this.state.tourCount /* This is a hack to get the tour to reset after it ends, so it can be shown again */}
            run={tourVisible}
            steps={tourSteps}
            showProgress
            styles={{
              options: {
                arrowColor: '#fff',
                backgroundColor: '#fff',
                primaryColor: '#000',
                borderRadius: 0,
                textColor: 'rgba(20, 20, 20, 1.000)',
                overlayColor: 'rgba(0,0,0,.7)',
              },
              tooltip: {
                borderRadius: 0,
                fontSize: "16px"
              },
              beaconInner: {
                borderRadius: 0,
                backgroundColor: "rgba(255, 0, 72, 1.000)"
              },
              beaconOuter: {
                borderRadius: 0,
                backgroundColor: "rgba(255, 0, 72, .2)",
                border: "2px solid rgba(255, 0, 72, 1.000)"
              },
              beacon: {
                transform: "rotate(45deg)"
              },
              buttonNext: {
                borderRadius: 0,
                border: "1px solid rgba(58, 180, 208, 1.000)",
                color: "rgba(58, 180, 208, 1.000)",
                background: "none",
                cursor: "pointer"
              },
              buttonBack: {
                borderRadius: 0,
                border: "1px solid rgba(0,0,0,.3)",
                color: "rgba(0,0,0,.6)",
                background: "none",
                opacity: ".7",
                cursor: "pointer"
              },
              buttonSkip: {
                borderRadius: 0,
                border: "1px solid rgba(0,0,0,1)",
                color: "rgba(0,0,0,1)",
                background: "none",
                cursor: "pointer"
              }
            }}
          />
          <div className={css.top}>
            <DaoHeader dao={dao} />
            <DaoNav currentAccountAddress={currentAccountAddress} dao={dao} numRedemptions={numRedemptions} />
          </div>
          <div className={css.wrapper}>
            <Switch>
              <Route exact path="/dao/:daoAddress/history" component={DaoHistoryContainer} />
              <Route exact path="/dao/:daoAddress/members" component={DaoMembersContainer} />
              <Route exact path="/dao/:daoAddress/redemptions" component={DaoRedemptionsContainer} />
              <Route exact path="/dao/:daoAddress/proposal/:proposalId" component={ViewProposalContainer} />
              <Route path="/dao/:daoAddress" component={DaoProposalsContainer} />
            </Switch>
          </div>
        </div>
      );
    } else {
      return (<div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/></div>);
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withCookies(ViewDaoContainer));
