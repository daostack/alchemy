import { IDAOState } from "@daostack/client";
import * as uiActions from "actions/uiActions";
import { checkWeb3Provider, enableMetamask, getArc } from "arc";
import AccountBalances from "components/Account/AccountBalances";
import AccountImage from "components/Account/AccountImage";
import AccountProfileName from "components/Account/AccountProfileName";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import { copyToClipboard } from "lib/util";
import * as queryString from "query-string";
import * as React from "react";
import { Breadcrumbs } from "react-breadcrumbs-dynamic";
import { connect } from "react-redux";
import { Link, matchPath, NavLink, RouteComponentProps } from "react-router-dom";
import { IRootState } from "reducers";
import { NotificationStatus, showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import * as css from "./App.scss";

interface IStateProps {
  accounts: string[];
  currentAccountProfile: IProfileState;
  dao: IDAOState;
  currentAccountAddress: string | null;
  networkId: number;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  const dao = ownProps.dao;
  return {
    currentAccountProfile: state.profiles[state.web3.currentAccountAddress],
    dao,
    currentAccountAddress: state.web3.currentAccountAddress
  };
};

interface IDispatchProps {
  showNotification: typeof showNotification;
  showTour: typeof uiActions.showTour;
}

const mapDispatchToProps = {
  showNotification,
  showTour: uiActions.showTour
};

type IProps = IStateProps & IDispatchProps;

class HeaderContainer extends React.Component<IProps, null> {

  constructor(props: IProps) {
    super(props);
    this.copyAddress = this.copyAddress.bind(this);
  }

  public copyAddress(e: any) {
    const { showNotification, currentAccountAddress } = this.props;
    copyToClipboard(currentAccountAddress);
    showNotification(NotificationStatus.Success, `Copied to clipboard!`);
    e.preventDefault();
  }

  public handleClickTour = () => {
    const { showTour } = this.props;
    showTour();
  }

  public handleClickLogin = async () => {
    try {
      await checkWeb3Provider();
      await enableMetamask();
    } catch (err) {
      this.props.showNotification(NotificationStatus.Failure, err.message);
    }
  }

  public render() {
    const {
      currentAccountProfile,
      dao,
      currentAccountAddress,
    } = this.props;

    const daoAvatarAddress = dao ? dao.address : null;

    return(
      <div className={css.headerContainer}>
        <nav className={css.header}>
          <div className={css.menu}>
            <img src="/assets/images/alchemy-logo-white.svg"/>
          </div>
          <div className={css.topInfo}>
            <Breadcrumbs
              separator={<b> >   </b>}
              item={ NavLink }
              finalItem={"b"}
              compare={(a: any, b: any) => a.weight ? a.weight - b.weight : a.to.length - b.to.length}
            />
          </div>
          <div className={css.headerRight}>
            { currentAccountAddress &&
              <div className={css.accountInfo}>
                <div className={css.accountImage}>
                  <Link className={css.profileLink}
                    to={"/profile/" + currentAccountAddress + (daoAvatarAddress ? "?daoAvatarAddress=" + daoAvatarAddress : "")}>
                    <AccountImage accountAddress={currentAccountAddress} />
                  </Link>
                </div>
                <div className={css.holdings}>
                  <div className={css.pointer}></div>
                  <div className={css.walletDetails}>
                    <div className={css.profileName}>
                      <AccountProfileName accountAddress={currentAccountAddress}
                        accountProfile={currentAccountProfile} daoAvatarAddress={daoAvatarAddress} />
                    </div>
                    <div className={css.holdingsLabel}>Your wallet</div>
                    <div className={css.copyAddress} style={{cursor: "pointer"}} onClick={this.copyAddress}>
                      <span>{currentAccountAddress ? currentAccountAddress.slice(0, 40) : "No account known"}</span>
                      <img src="/assets/images/Icon/Copy-white.svg"/>
                      <div className={css.fade}></div>
                    </div>
                  </div>
                  <AccountBalances dao={dao} address={currentAccountAddress} />
                </div>
              </div>
            }
          </div>
        </nav>
      </div>
    );
  }
}

const ConnectedHeaderContainer = connect(mapStateToProps, mapDispatchToProps)(HeaderContainer);

export default (props: RouteComponentProps<any>) => {
    const arc = getArc();
    const match = matchPath(props.location.pathname, {
      path: "/dao/:daoAvatarAddress",
      strict: false
    });
    const queryValues = queryString.parse(props.location.search);
    const daoAddress = match && match.params ? (match.params as any).daoAvatarAddress : queryValues.daoAvatarAddress;

    if (daoAddress) {
      return <Subscribe observable={arc.dao(daoAddress).state()}>{(state: IObservableState<IDAOState>) => {
          if (state.isLoading) {
            return null;
          } else if (state.error) {
            return <div>{state.error.message}</div>;
          } else {
            return <ConnectedHeaderContainer {...props} dao={state.data} />;
          }
        }
      }</Subscribe>;
  } else {
    return <ConnectedHeaderContainer dao={undefined} {...props }/>;
  }
};
