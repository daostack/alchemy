import * as Arc from "@daostack/arc.js";
import * as classNames from "classnames";
import * as moment from "moment";
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
import { checkProposalExpired, IAccountState, IDaoState, IProposalState, IRedemptionState, ProposalStates, proposalPassed } from "reducers/arcReducer";
import { NotificationStatus, showNotification } from "reducers/notifications";
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
  openProposals: IProposalState[];
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
    openProposals: dao ? selectors.createOpenProposalsSelector()(state, ownProps) : [],
    tourVisible: state.ui.tourVisible
  };
};

interface IDispatchProps {
  onTransferEvent: typeof arcActions.onTransferEvent;
  onReputationChangeEvent: typeof arcActions.onReputationChangeEvent;
  onDAOEthBalanceChanged: typeof arcActions.onDAOEthBalanceChanged;
  onDAOGenBalanceChanged: typeof arcActions.onDAOGenBalanceChanged;
  onProposalExpired: typeof arcActions.onProposalExpired;
  updateDAOLastBlock: typeof arcActions.updateDAOLastBlock;
  hideTour: typeof uiActions.hideTour;
  showTour: typeof uiActions.showTour;
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  onTransferEvent: arcActions.onTransferEvent,
  onReputationChangeEvent: arcActions.onReputationChangeEvent,
  onDAOEthBalanceChanged: arcActions.onDAOEthBalanceChanged,
  onDAOGenBalanceChanged: arcActions.onDAOGenBalanceChanged,
  onProposalExpired: arcActions.onProposalExpired,
  updateDAOLastBlock: arcActions.updateDAOLastBlock,
  hideTour: uiActions.hideTour,
  showTour: uiActions.showTour,
  showNotification
};

type IProps = IStateProps & IDispatchProps;

interface IState {
  readyToShow: boolean;
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
      // On production this is used to wait 10 seconds to load changes since last cache before showing the DAO
      readyToShow: process.env.NODE_ENV == 'development',
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
      onProposalExpired,
      showNotification,
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
    }, -1);

    this.burnEventWatcher = daoInstance.reputation.Burn({}, { fromBlock: dao.lastBlock });
    this.burnEventWatcher.watch((error: any, result: any) => {
      onReputationChangeEvent(daoAvatarAddress, result.args._from);
    }, -1);

    const stakingTokenAddress = await votingMachineInstance.contract.stakingToken();
    const stakingToken = await (await Arc.Utils.requireContract("StandardToken")).at(stakingTokenAddress) as any;

    this.blockInterval = setInterval(async () => {
      const newEthBalance = Util.fromWei(await promisify(web3.eth.getBalance)(daoAvatarAddress));
      await onDAOEthBalanceChanged(daoAvatarAddress, newEthBalance);
      const newGenBalance = Util.fromWei(await stakingToken.balanceOf(daoAvatarAddress));
      await onDAOGenBalanceChanged(daoAvatarAddress, newGenBalance);

      // Check all proposals to see if any expired
      for (const proposal of this.props.openProposals) {
        const newState = checkProposalExpired(proposal);
        if (newState != proposal.state) {
          await Promise.resolve(onProposalExpired(proposal));
        }
      }

      updateDAOLastBlock(daoAvatarAddress, await Util.getLatestBlock());
      this.setState({ readyToShow: true });
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

    if (!dao || !this.state.readyToShow) {
      return (<div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/></div>);
    }

    const tourSteps = [
      {
        target: "." + css.daoInfo,
        content: `Alchemy is a collaborative application used by the Genesis Alpha DAO to fund proposals. Anyone can make proposals for funding using Alchemy, and anyone who has acquired reputation in the Genesis Alpha DAO can vote on whether to fund proposals. Currently, ${dao.name} has ${Object.keys(dao.members).length} members with a total of ${Math.round(dao.reputationCount).toLocaleString()} reputation`,
        placement: "right",
        disableBeacon: true
      },
      {
        target: "." + appCss.accountInfo,
        content: "This icon represents your ETH wallet. Here you can view your reputation and token balances.",
        placement: "bottom",
        disableBeacon: true
      },
      {
        target: "." + css.holdings,
        content: "The amount in ETH represents the budget currently available for funding proposals. The amount in GEN represents the amount currently available for rewarding voters and predictors.",
        placement: "left",
        disableBeacon: true
      },
      {
        target: "." + css.createProposal,
        content: "Do you have an idea for an initiative to improve the DAOstack project or ecosystem? Create a proposal to get it funded. If the proposal passes, funds will be transferred to the target account automatically and you will be rewarded with additional reputation and GEN. If a proposal fails, there is no penalty for the proposer.",
        placement: "top",
        disableBeacon: true
      },
      {
        target: "." + proposalCss.voteControls,
        content: "If you have reputation in the DAO, you can vote on proposals. If your vote corresponds with the outcome of the voting (i.e. you vote yes on a proposal that passes, or vote no on a proposal that fails), you will be rewarded with reputation and GEN.",
        placement: "right",
        disableBeacon: true
      },
      {
        target: "." + css.regularContainer,
        content: "Regular proposals need an absolute majority to be approved by the DAO. This means that 50% of all reputation needs to vote yes on a non-boosted proposal for it to pass.",
        placement: "top",
        disableBeacon: true
      },
      {
        target: "." + css.boostedContainer,
        content: "Boosted proposals pass or fail based on relative-majority voting. This means that the proposal will pass or fail based on whichever side gets more voting support during a three-day voting period. There is no need for an absolute majority of all DAO reputation. Proposals become boosted when enough people use GEN to stake for their success.",
        placement: "top",
        disableBeacon: true
      },
      {
        target: "." + proposalCss.predictions,
        content: "Influencing proposals isn’t limited to reputation- holders only. Anyone can help direct the attention of the DAO by using GEN to stake on whether a proposal will pass or fail. When enough GEN are staked on the passing of a proposal, it becomes a boosted proposal. Conversely, GEN that are staked on a proposal’s failure can prevent the boosting of a proposal. If you stake with GEN and correctly predict the outcome of a proposal, you will be rewarded with more GEN and reputation.",
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
            <p>New to Alchemy? Take this tour to learn how <strong>voting, reputation, predictions,</strong> and <strong>proposals</strong> work.</p>
            <div>
              <button onClick={this.handleClickSkipTour}><img src="/assets/images/Tour/SkipTour.svg"/> Skip for now</button>
              <button className={css.startButton} onClick={this.handleClickStartTour}><img src="/assets/images/Tour/StartTour.svg"/> Take a quick tour</button>
            </div>
          </div>
          <div className={tourEndClass}>
            <h1>You’re done!</h1>
            <p>Thanks for taking the time to learn about Alchemy.
For additional information check out our <a href="https://docs.google.com/document/d/1M1erC1TVPPul3V_RmhKbyuFrpFikyOX0LnDfWOqO20Q/edit">FAQ</a> and this <a href="https://medium.com/daostack/new-introducing-alchemy-budgeting-for-decentralized-organizations-b81ba8501b23">Intro to Alchemy</a> article.</p>
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
