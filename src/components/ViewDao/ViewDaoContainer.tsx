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
import { IAccountState, IDaoState, IProposalState, IRedemptionState } from "reducers/arcReducer";
import * as selectors from "selectors/daoSelectors";
import * as schemas from "schemas";

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
  daoAvatarAddress: string;
  lastBlock: number;
  numRedemptions: number;
  tourVisible: boolean;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  const dao = denormalize(state.arc.daos[ownProps.match.params.daoAvatarAddress], schemas.daoSchema, state.arc) as IDaoState;
  const account = denormalize(state.arc.accounts[`${state.web3.ethAccountAddress}-${ownProps.match.params.daoAvatarAddress}`], schemas.accountSchema, state.arc) as IAccountState;
  let numRedemptions = 0;

  if (account) {
    numRedemptions = Object.keys(account.redemptions).length;
  }

  return {
    currentAccountAddress: state.web3.ethAccountAddress,
    dao,
    daoAvatarAddress : ownProps.match.params.daoAvatarAddress,
    numRedemptions,
    tourVisible: state.ui.tourVisible
  };
};

interface IDispatchProps {
  onTransferEvent: typeof arcActions.onTransferEvent;
  onReputationChangeEvent: typeof arcActions.onReputationChangeEvent;
  onDAOEthBalanceChanged: typeof arcActions.onDAOEthBalanceChanged;
  onDAOGenBalanceChanged: typeof arcActions.onDAOGenBalanceChanged;
  updateDAOLastBlock: typeof arcActions.updateDAOLastBlock;
  hideTour: typeof uiActions.hideTour;
  showTour: typeof uiActions.showTour;
}

const mapDispatchToProps = {
  onTransferEvent: arcActions.onTransferEvent,
  onReputationChangeEvent: arcActions.onReputationChangeEvent,
  onDAOEthBalanceChanged: arcActions.onDAOEthBalanceChanged,
  onDAOGenBalanceChanged: arcActions.onDAOGenBalanceChanged,
  updateDAOLastBlock: arcActions.updateDAOLastBlock,
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
  public transferEventWatcher: any;
  public mintEventWatcher: any;
  public burnEventWatcher: any;
  public blockInterval: any;

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

  public componentDidMount() {
    this.setupWatchers();
  }

  public async componentDidUpdate(prevProps: IProps) {
    if (this.props.dao && !prevProps.dao) {
      // Make sure watchers get setup when DAO is loaded
      await this.setupWatchers();
    }
  }

  public componentWillUnmount() {
    if (this.transferEventWatcher) {
      this.transferEventWatcher.stopWatching();
    }

    if (this.mintEventWatcher) {
      this.mintEventWatcher.stopWatching();
    }

    if (this.burnEventWatcher) {
      this.burnEventWatcher.stopWatching();
    }

    if (this.blockInterval) {
      clearInterval(this.blockInterval);
    }
  }

  // Setup event watchers if they are not setup already and if the dao is loaded
  public async setupWatchers() {
    if (this.mintEventWatcher || !this.props.dao) {
      return;
    }

    const {
      daoAvatarAddress,
      dao,
      onTransferEvent,
      onReputationChangeEvent,
      onDAOEthBalanceChanged,
      onDAOGenBalanceChanged,
      updateDAOLastBlock
    } = this.props;

    // We have the DAO loaded but haven't set up the watchers yet, so set them up
    // TODO: move all this to app container and just setup watchers for each DAO, plus one blockInterval looking at every block
    const web3 = await Arc.Utils.getWeb3();
    const daoInstance = await Arc.DAO.at(daoAvatarAddress);
    const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
    const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(daoAvatarAddress)).votingMachineAddress;
    const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);

    this.mintEventWatcher = daoInstance.reputation.Mint({}, { fromBlock: dao.lastBlock });
    this.mintEventWatcher.watch((error: any, result: any) => {
      onReputationChangeEvent(daoAvatarAddress, result.args._to);
    });

    this.burnEventWatcher = daoInstance.reputation.Burn({}, { fromBlock: dao.lastBlock });
    this.burnEventWatcher.watch((error: any, result: any) => {
      onReputationChangeEvent(daoAvatarAddress, result.args._from);
    });

    const stakingTokenAddress = await votingMachineInstance.contract.stakingToken();
    const stakingToken = await (await Arc.Utils.requireContract("StandardToken")).at(stakingTokenAddress) as any;

    this.blockInterval = setInterval(async () => {
      const newEthBalance = Util.fromWei(await promisify(web3.eth.getBalance)(daoAvatarAddress));
      onDAOEthBalanceChanged(daoAvatarAddress, newEthBalance);
      const newGenBalance = Util.fromWei(await stakingToken.balanceOf(daoAvatarAddress));
      onDAOGenBalanceChanged(daoAvatarAddress, newGenBalance);
      updateDAOLastBlock(daoAvatarAddress, await Util.getLatestBlock());
    }, 10000);
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

    if (!dao) {
      return (<div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/></div>);
    }

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
        content: "Regular proposals: Regular proposals need at least a 50% majority to be approved or rejected by the DAO. In other words, you need 50% of all reputation to vote Yes on a regular proposal for it to pass.",
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

    return (
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
            <Route exact path="/dao/:daoAvatarAddress/history" component={DaoHistoryContainer} />
            <Route exact path="/dao/:daoAvatarAddress/members" component={DaoMembersContainer} />
            <Route exact path="/dao/:daoAvatarAddress/redemptions" component={DaoRedemptionsContainer} />
            <Route exact path="/dao/:daoAvatarAddress/proposal/:proposalId" component={ViewProposalContainer} />
            <Route path="/dao/:daoAvatarAddress" component={DaoProposalsContainer} />
          </Switch>
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withCookies(ViewDaoContainer));
