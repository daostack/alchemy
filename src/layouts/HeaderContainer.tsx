import * as Arc from "@daostack/arc.js";
import promisify = require("es6-promisify");
import Tooltip from "rc-tooltip";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { connect } from "react-redux";
import { Link, RouteComponentProps } from "react-router-dom";
import { CSSTransition } from "react-transition-group";
import { FilterResult } from "web3";

import * as uiActions from "actions/uiActions";
import * as web3Actions from "actions/web3Actions";
import { IRootState } from "reducers";
import { IAccountState, IDaoState, newAccount } from "reducers/arcReducer";
import { showNotification, NotificationStatus } from 'reducers/notifications'
import { IProfilesState, IProfileState } from "reducers/profilesReducer";
import { IWeb3State } from "reducers/web3Reducer";
import Util from "lib/util";

import AccountBalance from "components/Account/AccountBalance";
import AccountImage from "components/Account/AccountImage";
import AccountProfileName from "components/Account/AccountProfileName";
import ReputationView from "components/Account/ReputationView";

import * as css from "./App.scss";

interface IStateProps {
  accounts: string[];
  currentAccountEthBalance: number;
  currentAccountExternalTokenBalance: number;
  currentAccountGenBalance: number;
  currentAccountGenStakingAllowance: number;
  currentAccountProfile: IProfileState;
  currentAccount: IAccountState;
  dao: IDaoState;
  daoAvatarAddress: string;
  ethAccountAddress: string | null;
  networkId: number;
  pageURL: string;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    accounts: state.web3.accounts,
    currentAccount: state.arc.accounts[`${state.web3.ethAccountAddress}-${ownProps.daoAvatarAddress}`],
    currentAccountEthBalance: state.web3.currentAccountEthBalance,
    currentAccountExternalTokenBalance: state.web3.currentAccountExternalTokenBalance,
    currentAccountGenBalance: state.web3.currentAccountGenBalance,
    currentAccountGenStakingAllowance: state.web3.currentAccountGenStakingAllowance,
    currentAccountProfile: state.profiles[state.web3.ethAccountAddress],
    dao: state.arc.daos[ownProps.daoAvatarAddress],
    daoAvatarAddress: ownProps.daoAvatarAddress,
    ethAccountAddress: state.web3.ethAccountAddress,
    networkId: state.web3.networkId,
    pageURL: ownProps.location.pathname
  };
};

interface IDispatchProps {
  setCurrentAccount: typeof web3Actions.setCurrentAccount;
  onApprovedStakingGens: typeof web3Actions.onApprovedStakingGens;
  onEthBalanceChanged: typeof web3Actions.onEthBalanceChanged;
  onExternalTokenBalanceChanged: typeof web3Actions.onExternalTokenBalanceChanged
  onGenBalanceChanged: typeof web3Actions.onGenBalanceChanged;
  onGenStakingAllowanceChanged: typeof web3Actions.onGenStakingAllowanceChanged;
  showNotification: typeof showNotification;
  showTour: typeof uiActions.showTour;
}

const mapDispatchToProps = {
  setCurrentAccount: web3Actions.setCurrentAccount,
  onApprovedStakingGens: web3Actions.onApprovedStakingGens,
  onEthBalanceChanged: web3Actions.onEthBalanceChanged,
  onExternalTokenBalanceChanged: web3Actions.onExternalTokenBalanceChanged,
  onGenBalanceChanged: web3Actions.onGenBalanceChanged,
  onGenStakingAllowanceChanged: web3Actions.onGenStakingAllowanceChanged,
  showNotification,
  showTour: uiActions.showTour
};

type IProps = IStateProps & IDispatchProps;

const Fade = ({ children, ...props }: any) => (
  <CSSTransition
    {...props}
    timeout={1000}
    classNames={{
     enter: css.fadeEnter,
     enterActive: css.fadeEnterActive,
     exit: css.fadeExit,
     exitActive: css.fadeExitActive,
    }}
  >
    {children}
  </CSSTransition>
);

class HeaderContainer extends React.Component<IProps, null> {
  private ethBalanceWatcher: FilterResult;
  private approvalWatcher: FilterResult;

  constructor(props: IProps) {
    super(props);

    this.copyAddress = this.copyAddress.bind(this);
  }

  public async componentDidMount() {
    const {
      accounts,
      currentAccountGenStakingAllowance,
      currentAccountGenBalance,
      currentAccountEthBalance,
      currentAccount,
      dao,
      daoAvatarAddress,
      ethAccountAddress,
      networkId,
      onApprovedStakingGens,
      onEthBalanceChanged,
      onExternalTokenBalanceChanged,
      onGenBalanceChanged,
      onGenStakingAllowanceChanged,
      setCurrentAccount
    } = this.props;

    const web3 = await Arc.Utils.getWeb3();

    await setCurrentAccount(ethAccountAddress, daoAvatarAddress ? daoAvatarAddress : null);

    let votingMachineInstance: Arc.GenesisProtocolWrapper;
    if (daoAvatarAddress) {
      const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
      const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(daoAvatarAddress)).votingMachineAddress;
      votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);
    } else {
      votingMachineInstance = await Arc.GenesisProtocolFactory.deployed();
    }
    const stakingTokenAddress = await votingMachineInstance.contract.stakingToken();
    const stakingToken = await (await Arc.Utils.requireContract("StandardToken")).at(stakingTokenAddress) as any;

    this.ethBalanceWatcher = web3.eth.filter('latest');
    this.ethBalanceWatcher.watch(async (err, res) => {
      if (!err && res) {
        const newEthBalance = Util.fromWei(await promisify(web3.eth.getBalance)(ethAccountAddress));
        onEthBalanceChanged(newEthBalance);
        const newGenBalance = Util.fromWei(await stakingToken.balanceOf(ethAccountAddress));
        onGenBalanceChanged(newGenBalance);
        const newGenStakingAllowance = Util.fromWei(await stakingToken.allowance(ethAccountAddress, votingMachineInstance.address));
        onGenStakingAllowanceChanged(newGenStakingAllowance);
      }
    });

    // Watch for approval of GEN token tranfers
    this.approvalWatcher = stakingToken.Approval({ owner: ethAccountAddress }, { fromBlock: "latest" });
    this.approvalWatcher.watch((error: any, result: any) => {
      if (!error && result) {
        onApprovedStakingGens(result.args.value.toNumber());
      }
    });
  }

  public componentWillUnmount() {
    this.ethBalanceWatcher.stopWatching();
    this.approvalWatcher.stopWatching();
  }

  public copyAddress(e: any) {
    const { showNotification, ethAccountAddress } = this.props;
    // Copy the address to clipboard
    Util.copyToClipboard(ethAccountAddress);
    showNotification(NotificationStatus.Success, `Copied to clipboard!`);
    e.preventDefault();
  }

  public handleChangeAccount = (e: any) => {
    const selectElement = ReactDOM.findDOMNode(this.refs.accountSelectNode) as HTMLSelectElement;
    const newAddress = selectElement.value;
    this.props.setCurrentAccount(newAddress, this.props.daoAvatarAddress ? this.props.daoAvatarAddress : null);
  }

  public handleClickTour = (e: any) => {
    const { showTour } = this.props;
    showTour();
  }

  public render() {
    let {
      accounts,
      currentAccount,
      currentAccountEthBalance,
      currentAccountExternalTokenBalance,
      currentAccountGenBalance,
      currentAccountGenStakingAllowance,
      currentAccountProfile,
      dao,
      daoAvatarAddress,
      ethAccountAddress,
      networkId,
      pageURL,
      showTour
    } = this.props;

    if (!currentAccount) {
      currentAccount = newAccount(daoAvatarAddress, ethAccountAddress);
    }

    const isProfilePage = pageURL.includes("profile");

    const accountOptionNodes = accounts.map((account: string) => (
      <option key={"account_" + account}>
        {account}
      </option>
    ));

    return(
      <div>
        <div className={css.notice}>
          <div>
            <img src="/assets/images/Icon/Alert.svg"/>
            Alchemy and Arc are in Alpha. There will be BUGS! All reputation accumulated will be reset. We don't guarantee complete security. <b>**Play at your own risk**</b>
          </div>
          <a className={css.reportBugs} href="mailto:bugs@daostack.io">REPORT BUGS</a>
        </div>
        <nav className={css.header}>
          <div className={css.menu}>
            <img src="/assets/images/Icon/Menu.svg"/>
            <div className={css.menuWrapper}>
              <div className={css.backgroundBlock}></div>
              <ul>
                <li><Link to='/'>Home</Link></li>
                { process.env.NODE_ENV == 'production'
                  ? <li><a href='https://alchemy.daostack.io/dao/0xa3f5411cfc9eee0dd108bf0d07433b6dd99037f1'>Genesis Alpha</a></li>
                  : <li><Link to='/daos'>View DAOs</Link></li>
                }
                <li><a href="https://docs.google.com/document/d/1M1erC1TVPPul3V_RmhKbyuFrpFikyOX0LnDfWOqO20Q/" target='_blank'>FAQ</a></li>
                <li><a href="https://medium.com/daostack/new-introducing-alchemy-budgeting-for-decentralized-organizations-b81ba8501b23" target='_blank'>Alchemy 101</a></li>
                <li><a href="https://www.daostack.io/" target='_blank'>About DAOstack</a></li>
                <li><a href="https://t.me/joinchat/BMgbsAxOJrZhu79TKB7Y8g" target='_blank'>Get involved</a></li>
                <li>
                  <a>Buy GEN</a>
                  <ul>
                    <li><h2>EXCHANGES</h2></li>
                    <li><a href="https://idex.market/eth/gen" target="_blank"><img src="/assets/images/Exchanges/idex.png"/> IDEX</a></li>
                    <li><a href="https://ddex.io/trade/GEN-ETH" target="_blank"><img src="/assets/images/Exchanges/ddex.png"/> DDEX</a></li>
                    <li><a href="https://forkdelta.github.io/#!/trade/0x543ff227f64aa17ea132bf9886cab5db55dcaddf-ETH" target="_blank"><img src="/assets/images/Exchanges/forkdelta.png"/> Forkdelta</a></li>
                    <li><a href="https://etherdelta.com/#0x543ff227f64aa17ea132bf9886cab5db55dcaddf-ETH" target="_blank"><img src="/assets/images/Exchanges/etherdelta.png"/> Etherdelta</a></li>
                    <li><a href="https://www.hotbit.io/exchange?symbol=GEN_ETH" target="_blank"><img src="/assets/images/Exchanges/hotbit.png"/> Hotbit</a></li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
          <div className={css.logoContainer}>
            <Link className={css.alchemyLogo} to="/"><img src="/assets/images/alchemy-logo-white.svg"/></Link>
            <span className={css.version}><em>Alchemy {Util.networkName(networkId)}</em> <span> v.{VERSION}</span></span>
          </div>
          <div className={css.headerRight}>
            <Link className={css.profileLink} to={"/profile/" + ethAccountAddress + (daoAvatarAddress ? "?daoAvatarAddress=" + daoAvatarAddress : "")}>{currentAccountProfile && currentAccountProfile.name ? "EDIT PROFILE" : "CREATE PROFILE"}</Link>
            <div className={css.accountInfo}>
              <div className={css.accountImage}>
                <AccountImage accountAddress={ethAccountAddress} />
              </div>
              <div className={css.holdings}>
                <div className={css.pointer}></div>
                <div className={css.walletDetails}>
                  <div className={css.profileName}><AccountProfileName accountProfile={currentAccountProfile} daoAvatarAddress={daoAvatarAddress} /></div>
                  <div className={css.holdingsLabel}>Your wallet</div>
                  <div className={css.copyAddress} style={{cursor: 'pointer'}} onClick={this.copyAddress}>
                    <span>{ethAccountAddress.slice(0, 40)}</span>
                    <img src="/assets/images/Icon/Copy-white.svg"/>
                    <div className={css.fade}></div>
                  </div>
                </div>
                <div className={css.balances}>
                  <div className={css.userBalance}>
                    <div>
                      <AccountBalance tokenSymbol="ETH" balance={currentAccountEthBalance} accountAddress={ethAccountAddress} />
                    </div>
                    <div>
                      <AccountBalance tokenSymbol="GEN" balance={currentAccountGenBalance} accountAddress={ethAccountAddress} />
                    </div>
                    <div>
                      {currentAccountGenStakingAllowance} GEN approved for staking
                    </div>
                    { dao && dao.externalTokenAddress
                      ? <div>
                          <AccountBalance tokenSymbol={dao.externalTokenSymbol} balance={currentAccountExternalTokenBalance} accountAddress={ethAccountAddress} />
                        </div>
                      : ""
                    }
                  </div>
                  { dao
                    ? <div className={css.daoBalance}>
                        <h3>{dao.name}</h3>
                        <ReputationView daoName={dao.name} totalReputation={dao.reputationCount} reputation={currentAccount.reputation}/>
                        <label>REPUTATION</label>
                      </div>
                    : ""
                  }
                </div>
                { accounts.length > 1 ?
                  <div className={css.testAccounts}>
                    <select onChange={this.handleChangeAccount} ref="accountSelectNode" defaultValue={ethAccountAddress}>
                      {accountOptionNodes}
                    </select>
                    <button className={css.selectTestAccount}>Switch accounts</button>
                  </div>
                : ""
                }
              </div>
            </div>
            { dao && !isProfilePage
              ? <button className={css.openTour} onClick={this.handleClickTour}><img src="/assets/images/Tour/TourButton.svg"/></button>
              : ""
            }
          </div>
        </nav>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(HeaderContainer);
