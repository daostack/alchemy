import * as uiActions from "@store/ui/uiActions";
import { threeBoxLogout } from "@store/profiles/profilesActions";
import { enableWalletProvider, getAccountIsEnabled, logout, getWeb3ProviderInfo, getWeb3Provider, providerHasConfigUi, getArcs } from "arc";
import AccountImage from "components/Account/AccountImage";
import AccountProfileName from "components/Account/AccountProfileName";
import RedemptionsButton from "components/Redemptions/RedemptionsButton";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import CopyToClipboard from "components/Shared/CopyToClipboard";
import { IRootState } from "@store";
import { showNotification } from "@store/notifications/notifications.reducer";
import { IProfileState } from "@store/profiles/profilesReducer";
import { parse } from "query-string";
import * as React from "react";
import { connect } from "react-redux";
import { Link, matchPath, NavLink, RouteComponentProps } from "react-router-dom";
import { Breadcrumbs } from "react-breadcrumbs-dynamic";
import { of } from "rxjs";
import classNames from "classnames";
import { Address, IDAOState } from "@daostack/arc.js";
import * as css from "./App.scss";
import ProviderConfigButton from "layouts/ProviderConfigButton";
import Tooltip from "rc-tooltip";
import { standardPolling, getArcByDAOAddress, Networks } from "lib/util";
import AccountBalances from "components/Account/AccountBalances";

interface IExternalProps extends RouteComponentProps<any> {
}

interface IStateProps {
  currentAccountProfile: IProfileState;
  currentAccountAddress: string | null;
  daoAvatarAddress: Address;
  menuOpen: boolean;
  threeBox: any;
  network: Networks;
}

const mapStateToProps = (state: IRootState & IStateProps, ownProps: IExternalProps): IExternalProps & IStateProps => {
  const match = matchPath(ownProps.location.pathname, {
    path: "/dao/:daoAvatarAddress",
    strict: false,
  });
  const queryValues = parse(ownProps.location.search);

  return {
    ...ownProps,
    currentAccountProfile: state.profiles[state.web3.currentAccountAddress],
    currentAccountAddress: state.web3.currentAccountAddress,
    daoAvatarAddress: match && match.params ? (match.params as any).daoAvatarAddress : queryValues.daoAvatarAddress,
    menuOpen: state.ui.menuOpen,
    threeBox: state.profiles.threeBox,
    network: state.web3.networkName as Networks,
  };
};

interface IDispatchProps {
  showNotification: typeof showNotification;
  toggleMenu: typeof uiActions.toggleMenu;
  threeBoxLogout: typeof threeBoxLogout;
}

const mapDispatchToProps = {
  showNotification,
  toggleMenu: uiActions.toggleMenu,
  threeBoxLogout,
};

type IProps = IExternalProps & IStateProps & IDispatchProps & ISubscriptionProps<IDAOState>;

class Header extends React.Component<IProps, null> {

  constructor (props: IProps) {
    super(props);
  }

  public componentDidMount() {
    this.setState({ alchemyVersion: PACKAGE_VERSION ?? "Not found" });
  }

  public handleClickLogin = async (_event: any): Promise<void> => {
    enableWalletProvider({
      suppressNotifyOnSuccess: true,
      showNotification: this.props.showNotification,
    }, undefined);
  }

  public handleConnect = async (_event: any): Promise<void> => {
    enableWalletProvider({
      suppressNotifyOnSuccess: true,
      showNotification: this.props.showNotification,
    }, undefined);
  }

  public handleClickLogout = async (_event: any): Promise<void> => {
    await logout(this.props.showNotification);
    await this.props.threeBoxLogout();
  }

  private handleToggleMenu = (_event: any): void => {
    this.props.toggleMenu();
  }

  private breadCrumbCompare = (a: any, b: any): number => a.weight ? a.weight - b.weight : a.to.length - b.to.length;

  public render(): RenderOutput {
    const {
      currentAccountProfile,
      currentAccountAddress,
      network,
    } = this.props;
    const dao = this.props.data;

    const daoAvatarAddress = dao ? dao.address : null;
    const accountIsEnabled = getAccountIsEnabled();
    const web3ProviderInfo = getWeb3ProviderInfo();
    const web3Provider = getWeb3Provider();

    return (
      <div className={css.headerContainer}>
        <nav className={css.header}>
          <div className={css.menuToggle} onClick={this.handleToggleMenu}>
            {this.props.menuOpen ?
              <img src="/assets/images/Icon/Close.svg" /> :
              <img src="/assets/images/Icon/Menu.svg" />}
          </div>
          <Tooltip overlay={`DAOstack Alchemy version: ${PACKAGE_VERSION ?? "Not found"}`} placement="bottomRight">
            <div className={css.menu}>
              <Link to="/">
                <img src="/assets/images/alchemy-logo-white.svg" />
              </Link>
            </div>
          </Tooltip>
          <div className={css.topInfo}>
            <Breadcrumbs
              separator={<b> &gt;   </b>}
              item={NavLink}
              finalItem={"b"}
              compare={this.breadCrumbCompare}
            />
          </div>
          <div className={css.redemptionsButton}>
            <RedemptionsButton currentAccountAddress={currentAccountAddress} />
          </div>
          <div className={css.accountInfo}>
            {currentAccountAddress ?
              <span>
                <div className={css.accountInfoContainer}>
                  <div className={css.accountImage}>
                    <div className={classNames({ [css.profileLink]: true, [css.noAccount]: !accountIsEnabled })}>
                      <AccountProfileName accountAddress={currentAccountAddress}
                        accountProfile={currentAccountProfile} daoAvatarAddress={daoAvatarAddress} />
                      <span className={classNames({ [css.walletImage]: true, [css.greyscale]: !accountIsEnabled })}>
                        <AccountImage accountAddress={currentAccountAddress} profile={currentAccountProfile} width={50} />
                      </span>
                    </div>
                  </div>
                </div>
                <div className={css.wallet}>
                  <div className={css.pointer}></div>
                  <div className={css.walletDetails}>
                    <div className={classNames({ [css.walletImage]: true, [css.greyscale]: !accountIsEnabled })}>
                      <AccountImage accountAddress={currentAccountAddress} profile={currentAccountProfile} width={50} />
                    </div>
                    <div className={css.profileName}>
                      <AccountProfileName accountAddress={currentAccountAddress}
                        accountProfile={currentAccountProfile} daoAvatarAddress={daoAvatarAddress} />
                    </div>
                    <div className={css.copyAddress}>
                      <div className={css.accountAddress}>{currentAccountAddress ? currentAccountAddress.slice(0, 40) : "No account known"}</div>
                      <CopyToClipboard value={currentAccountAddress} tooltipPlacement="left" />
                    </div>
                    <div className={css.fullProfile}>
                      <Link className={css.profileLink} to={"/profile/" + currentAccountAddress + (daoAvatarAddress ? "?daoAvatarAddress=" + daoAvatarAddress : "")}>
                        Full Profile
                      </Link>
                    </div>
                  </div>
                  {network &&
                  <React.Fragment>
                    <AccountBalances dao={dao ? dao : null} address={currentAccountAddress} network={network} arc={getArcs()[network]} />
                    <div className={css.currentNetwork}>
                      <div className={css.title}>Network</div>
                      {network}
                    </div>
                  </React.Fragment>
                  }
                  <div className={css.logoutButtonContainer}>
                    {accountIsEnabled ?
                      <div className={css.web3ProviderLogoutSection}>
                        <div className={css.provider}>
                          <div className={css.title}>Provider</div>
                          <div className={css.name}>{web3ProviderInfo.name}</div>
                        </div>
                        {providerHasConfigUi(web3Provider) ?
                          <div className={css.providerconfig}><ProviderConfigButton provider={web3Provider} providerName={web3ProviderInfo.name}></ProviderConfigButton></div>
                          : ""
                        }
                        <div className={css.web3ProviderLogInOut} onClick={this.handleClickLogout}><div className={css.text}>Log out</div> <img src="/assets/images/Icon/logout.svg" /></div>
                      </div> :
                      <div className={css.web3ProviderLogInOut} onClick={this.handleConnect}><div className={css.text}>Connect</div> <img src="/assets/images/Icon/login.svg" /></div>}
                  </div>
                </div>
              </span> : <span></span>
            }
            {!currentAccountAddress ?
              <div className={css.web3ProviderLogin}>
                <button onClick={this.handleClickLogin} data-test-id="loginButton">
                  Log in <img src="/assets/images/Icon/login-white.svg" />
                </button>
              </div>
              : (!accountIsEnabled) ?
                <div className={css.web3ProviderLogin}>
                  <button onClick={this.handleConnect} data-test-id="connectButton">
                    <span className={css.connectButtonText}>Connect</span><img src="/assets/images/Icon/login-white.svg" />
                  </button>
                </div>
                : ""
            }
          </div>
        </nav>
      </div >
    );
  }
}

const SubscribedHeader = withSubscription({
  wrappedComponent: Header,
  loadingComponent: null,
  errorComponent: (props) => <div>{props.error.message}</div>,
  checkForUpdate: ["daoAvatarAddress"],
  createObservable: (props: IProps) => {
    if (props.daoAvatarAddress) {
      const arc = getArcByDAOAddress(props.daoAvatarAddress);
      // subscribe if only to get DAO reputation supply updates
      return arc.dao(props.daoAvatarAddress).state(standardPolling());
    } else {
      return of(null);
    }
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SubscribedHeader);
