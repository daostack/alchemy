import { Address, IDAOState } from "@daostack/client";
import * as uiActions from "actions/uiActions";
import { enableWeb3ProviderAndWarn, getAccountIsEnabled, getArc, gotoReadonly, IWeb3ProviderInfo, getWeb3ProviderInfo } from "arc";
import * as classNames from "classnames";
import AccountBalances from "components/Account/AccountBalances";
import AccountImage from "components/Account/AccountImage";
import AccountProfileName from "components/Account/AccountProfileName";
import RedemptionsButton from "components/Redemptions/RedemptionsButton";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { copyToClipboard } from "lib/util";
import * as queryString from "query-string";
import Tooltip from "rc-tooltip";
import * as React from "react";
import { connect } from "react-redux";
import { Link, matchPath, NavLink, RouteComponentProps } from "react-router-dom";
import { Breadcrumbs } from "react-breadcrumbs-dynamic";
import { IRootState } from "reducers";
import { NotificationStatus, showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import { of } from "rxjs";

import * as css from "./App.scss";

interface IExternalProps extends RouteComponentProps<any> {
  loadCachedWeb3Provider: (showNotification: any) => Promise<boolean>;
  getCachedWeb3ProviderInfo: () => IWeb3ProviderInfo | null;
}

interface IStateProps {
  currentAccountProfile: IProfileState;
  currentAccountAddress: string | null;
  daoAvatarAddress: Address;
}

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {
  const match = matchPath(ownProps.location.pathname, {
    path: "/dao/:daoAvatarAddress",
    strict: false,
  });
  const queryValues = queryString.parse(ownProps.location.search);

  return {
    ...ownProps,
    currentAccountProfile: state.profiles[state.web3.currentAccountAddress],
    currentAccountAddress: state.web3.currentAccountAddress,
    daoAvatarAddress: match && match.params ? (match.params as any).daoAvatarAddress : queryValues.daoAvatarAddress,
  };
};

interface IDispatchProps {
  showNotification: typeof showNotification;
  showTour: typeof uiActions.showTour;
}

const mapDispatchToProps = {
  showNotification,
  showTour: uiActions.showTour,
};

type IProps = IExternalProps & IStateProps & IDispatchProps & ISubscriptionProps<IDAOState>;

class Header extends React.Component<IProps, null> {

  constructor(props: IProps) {
    super(props);
    this.copyAddress = this.copyAddress.bind(this);
  }

  public copyAddress(e: any): void {
    const { showNotification, currentAccountAddress } = this.props;
    copyToClipboard(currentAccountAddress);
    showNotification(NotificationStatus.Success, "Copied to clipboard!");
    e.preventDefault();
  }

  public handleClickLogin = async (_event: any): Promise<void> => {
    if (!await this.props.loadCachedWeb3Provider(this.props.showNotification)) {
      await enableWeb3ProviderAndWarn(this.props.showNotification, false);
    }
  }

  public handleConnect = async (_event: any): Promise<void> => {
    await enableWeb3ProviderAndWarn(this.props.showNotification, false);
  }

  public handleClickLogout = async (_event: any): Promise<void> => {
    await gotoReadonly(this.props.showNotification);
  }

  public render(): RenderOutput {
    const {
      currentAccountProfile,
      currentAccountAddress,
      location,
    } = this.props;
    const dao = this.props.data;

    const daoAvatarAddress = dao ? dao.address : null;
    const accountIsEnabled = getAccountIsEnabled();
    const web3ProviderInfo = getWeb3ProviderInfo();
    // const cachedWeb3ProviderInfo = this.props.getCachedWeb3ProviderInfo();

    return(
      <div className={css.headerContainer}>
        <nav className={classNames({
          [css.header]: true,
          [css.hasHamburger]: location.pathname.startsWith("/dao/"),
        })}>
          <div className={css.menu}>
            <img src="/assets/images/alchemy-logo-white.svg"/>
          </div>
          <div className={css.topInfo}>
            <Breadcrumbs
              separator={<b> &gt;   </b>}
              item={NavLink}
              finalItem={"b"}
              compare={(a: any, b: any): number => a.weight ? a.weight - b.weight : a.to.length - b.to.length}
            />
          </div>
          <div className={css.redemptionsButton}>
            <RedemptionsButton currentAccountAddress={currentAccountAddress} />
          </div>
          <div className={css.accountInfo}>
            { currentAccountAddress ?
              <div className={css.accountInfoContainer}>
                <div className={css.accountImage}>
                  <div className={classNames({ [css.profileLink]: true, [css.noAccount]: !accountIsEnabled })}>
                    <AccountProfileName accountAddress={currentAccountAddress}
                      accountProfile={currentAccountProfile} daoAvatarAddress={daoAvatarAddress} />
                    <span className={classNames({ [css.walletImage]: true, [css.greyscale]: !accountIsEnabled })}>
                      <AccountImage accountAddress={currentAccountAddress} />
                    </span>
                  </div>
                </div>
                <div className={css.wallet}>
                  <div className={css.pointer}></div>
                  <div className={css.walletDetails}>
                    <div className={classNames({ [css.walletImage]: true, [css.greyscale]: !accountIsEnabled })}>
                      <AccountImage accountAddress={currentAccountAddress} />
                    </div>
                    <div className={css.profileName}>
                      <AccountProfileName accountAddress={currentAccountAddress}
                        accountProfile={currentAccountProfile} daoAvatarAddress={daoAvatarAddress} />
                    </div>
                    <div className={css.copyAddress} style={{cursor: "pointer"}} onClick={this.copyAddress}>
                      <span>{currentAccountAddress ? currentAccountAddress.slice(0, 40) : "No account known"}</span>
                      <img src="/assets/images/Icon/Copy-blue.svg"/>
                    </div>
                    <div className={css.fullProfile}>
                      <Link className={css.profileLink} to={"/profile/" + currentAccountAddress + (daoAvatarAddress ? "?daoAvatarAddress=" + daoAvatarAddress : "")}>
                      Full Profile
                      </Link>
                    </div>
                  </div>
                  <AccountBalances dao={dao} address={currentAccountAddress} />
                  <div className={css.logoutButtonContainer}>
                    { accountIsEnabled ?
                      <div className={css.web3ProviderLogoutSection}>
                        <div className={css.provider}>
                          <div className={css.title}>Provider</div>
                          <div className={css.name}>{web3ProviderInfo.name}</div>
                        </div>
                        <div className={css.web3ProviderLogInOut}  onClick={this.handleClickLogout}><div className={css.text}>Log out</div> <img src="/assets/images/Icon/logout.svg"/></div>
                      </div> :
                      <div className={css.web3ProviderLogInOut}  onClick={this.handleClickLogin}><div className={css.text}>Log in</div> <img src="/assets/images/Icon/login.svg"/></div> }
                  </div>
                </div>
              </div> : ""
            }
            {!currentAccountAddress ?
              <div className={css.web3ProviderLogin}>
                <Tooltip placement="bottom" trigger={["hover"]} overlay={"Connect to a wallet provider"}>
                  <button onClick={this.handleClickLogin} data-test-id="loginButton">
                    Log in <img src="/assets/images/Icon/login-white.svg"/>
                  </button>
                </Tooltip>
              </div>
              : (!accountIsEnabled) ?
                <div className={css.web3ProviderLogin}>
                  <Tooltip placement="bottom" trigger={["hover"]} overlay={"Connect to a wallet provider"}>
                    <button onClick={this.handleConnect} data-test-id="connectButton">
                      <span className={css.connectButtonText}>Connect</span><img src="/assets/images/Icon/login-white.svg"/>
                    </button>
                  </Tooltip>
                </div>
                : ""
            }
          </div>
        </nav>
      </div>
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
      const arc = getArc();
      return arc.dao(props.daoAvatarAddress).state();
    } else {
      return of(null);
    }
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SubscribedHeader);
