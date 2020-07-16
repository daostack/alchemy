import { IDAOState, Token, Member } from "@daostack/arc.js";
import { hideMenu } from "actions/uiActions";
import { getArc } from "arc";
import TrainingTooltip from "components/Shared/TrainingTooltip";

import BN = require("bn.js");
import classNames from "classnames";
import FollowButton from "components/Shared/FollowButton";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { generate } from "geopattern";
import Analytics from "lib/analytics";
import { baseTokenName, ethErrorHandler, formatTokens, genName, getExchangesList, supportedTokens, fromWeiToString, ethBalanceDao } from "lib/util";
import { parse } from "query-string";
import * as React from "react";
import { matchPath, Link, RouteComponentProps } from "react-router-dom";
import { first } from "rxjs/operators";
import { IRootState } from "reducers";
import { connect } from "react-redux";
import { of } from "rxjs";

import Tooltip from "rc-tooltip";
import * as css from "./SidebarMenu.scss";

type IExternalProps = RouteComponentProps<any>;

interface IStateProps {
  daoAvatarAddress: string;
  menuOpen: boolean;
}

interface IDispatchProps {
  hideMenu: typeof hideMenu;
}

const mapDispatchToProps = {
  hideMenu,
};

type IProps = IExternalProps & IStateProps & IDispatchProps & ISubscriptionProps<IDAOState>;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {
  const match = matchPath(ownProps.location.pathname, {
    path: "/dao/:daoAvatarAddress",
    strict: false,
  });
  const queryValues = parse(ownProps.location.search);

  return {
    ...ownProps,
    daoAvatarAddress: match && match.params ? (match.params as any).daoAvatarAddress : queryValues.daoAvatarAddress,
    menuOpen: state.ui.menuOpen,
  };
};

class SidebarMenu extends React.Component<IProps, IStateProps> {

  constructor(props: IProps) {
    super(props);
  }

  public componentDidMount() {
    Analytics.trackLinks(".externalLink", "Clicked External Link", (link: any) => {
      return {
        Page: link.innerText,
        URL: link.getAttribute("href"),
      };
    });

    Analytics.trackLinks(".buyGenLink", "Clicked Buy Gen Link", (link: any) => {
      return {
        Origin: "Side Bar",
        URL: link.getAttribute("href"),
      };
    });
  }

  private handleCloseMenu = (_event: any): void => {
    this.props.hideMenu();
  }

  private drawNavHeadingLine = () => {
    return <svg viewBox="0 0 1 2" preserveAspectRatio="none"><line x1="0" y1="0" x2="1" y2="0"/></svg>;
  }

  public daoMenu() {
    const dao = this.props.data;

    const daoHoldingsAddress = "https://etherscan.io/tokenholdings?a=" + dao.address;
    const bgPattern = generate(dao.address + dao.name);

    return (
      <>
        <div className={css.daoName}>
          <Link to={"/dao/" + dao.address} onClick={this.handleCloseMenu}>
            <b className={css.daoIcon} style={{ backgroundImage: bgPattern.toDataUrl() }}></b>
            <em></em>
            <span>{dao.name}</span>
          </Link>
        </div>
        <div className={css.daoDescription}>
          {dao.name === "dxDAO" ?
            <p>
              By submitting a proposal, you agree to be bound by the&nbsp;
              <a className="externalLink" href="https://cloudflare-ipfs.com/ipfs/QmRQhXUKKfUCgsAf5jre18T3bz5921fSfvnZCB5rR8mCKj" target="_blank" rel="noopener noreferrer">Participation Agreement</a>, which includes the terms of participation in the dxDAO
            </p>
            : dao.name === "Meme" ?
              <p><a className="externalLink" href="https://docs.google.com/document/d/1iJZfjmOK1eZHq-flmVF_44dZWNsN-Z2KAeLqW3pLQo8" target="_blank" rel="noopener noreferrer">Learn how to MemeDAO</a></p>
              : dao.name === "ETHBerlin dHack.io" ?
                <p>
                For more info join our TG group -
                  <a className="externalLink" href="https://t.me/dhack0" target="_blank" rel="noopener noreferrer">t.me/dhack0</a>
                </p>
                : dao.name === "Identity" ?
                  <p>
                A curated registry of identities on the Ethereum blockchain.&nbsp;
                    <a className="externalLink" href="https://docs.google.com/document/d/1_aS41bvA6D83aTPv6QNehR3PfIRHJKkELnU76Sds5Xk" target="_blank" rel="noopener noreferrer">How to register.</a>
                  </p>
                  : <p>New to DAOstack? Visit the <a href="https://daostack.zendesk.com/hc" target="_blank" rel="noopener noreferrer">help center</a> to get started.</p>
          }
        </div>
        <div className={css.followButton}><FollowButton id={dao.address} type="daos" style="white" /></div>
        <div className={css.daoNavHeading}><div>DAO Menu</div>{this.drawNavHeadingLine()}</div>
        <div className={css.daoNavigation}>
          <ul>
            <li>
              <Link to={`/dao/${dao.address}`} onClick={this.handleCloseMenu} data-test-id="daohome">
                <span className={css.menuDot} />
                <span className={
                  classNames({
                    [css.notification]: true,
                    [css.homeNotification]: true,
                  })
                }></span>
                <img src="/assets/images/Icon/menu/home.svg" />
                Home
              </Link>
            </li>
            <li>
              <Link to={`/dao/${dao.address}/plugins`} onClick={this.handleCloseMenu} data-test-id="daoplugins">
                <span className={css.menuDot} />
                <span className={
                  classNames({
                    [css.notification]: true,
                    [css.proposalsNotification]: true,
                  })
                }></span>
                <img src="/assets/images/Icon/menu/chat.svg" />
                Proposals
              </Link>
            </li>
            <li>
              <TrainingTooltip placement="right" overlay={"List of entities (DAOs and individuals) that have voting power in the DAO"}>
                <Link to={"/dao/" + dao.address + "/members/"} onClick={this.handleCloseMenu}>
                  <span className={css.menuDot} />
                  <span className={
                    classNames({
                      [css.notification]: true,
                      [css.holdersNotification]: true,
                    })
                  }></span>
                  <img src="/assets/images/Icon/menu/holders.svg" />
                  Members
                </Link>
              </TrainingTooltip>
            </li>
            <li>
              <Link to={"/dao/" + dao.address + "/history/"} onClick={this.handleCloseMenu}>
                <span className={css.menuDot} />
                <span className={
                  classNames({
                    [css.notification]: true,
                    [css.historyNotification]: true,
                  })
                }></span>
                <img src="/assets/images/Icon/menu/history.svg" />
                History
              </Link>
            </li>
          </ul>
        </div>
        <div className={css.daoNavHeading}>
          <div>DAO Holdings</div>
          <a target="_blank" rel="noopener noreferrer" className="externalLink" href={daoHoldingsAddress}>
            <img src="/assets/images/Icon/link-white.svg" />
          </a>
          {this.drawNavHeadingLine()}
        </div>
        <div className={css.daoHoldings}>
          <ul>
            <li key={"0x0"}>
              <Tooltip overlay={`${
                fromWeiToString(dao.reputationTotalSupply)} REP`} placement="right">
                <strong>{formatTokens(dao.reputationTotalSupply)} REP</strong>
              </Tooltip>
            </li>

            <SubscribedEthBalance dao={dao} />

            {Object.keys(supportedTokens()).map((tokenAddress) => {
              return <SubscribedTokenBalance tokenAddress={tokenAddress} dao={dao} key={"token_" + tokenAddress} />;
            })}
          </ul>
        </div>
      </>
    );
  }

  public render(): RenderOutput {
    const sidebarClass = classNames({
      [css.menuOpen]: this.props.menuOpen,
      [css.sidebarWrapper]: true,
      [css.noDAO]: !this.props.daoAvatarAddress,
      clearfix: true,
    });

    return (
      <div className={sidebarClass}>
        <div className={css.menuContent}>
          { this.props.daoAvatarAddress && this.props.data ? this.daoMenu() : ""}

          <div className={css.siteLinksWrapper}>
            <ul>
              <li><Link to="/" onClick={this.handleCloseMenu}>Home</Link></li>
              <li>
                <TrainingTooltip overlay="See a feed of recent updates to DAOs you follow" placement="right">
                  <Link to="/feed" onClick={this.handleCloseMenu}>Feed</Link>
                </TrainingTooltip>
              </li>
              <li>
                <a>Buy GEN</a>
                <ul>
                  <div className={css.diamond}></div>
                  {
                    getExchangesList().map((item: any) => {
                      return (
                        <li key={item.name}>
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="buyGenLink">
                            <b><img src={item.logo} /></b>
                            <span>{item.name}</span>
                          </a>
                        </li>
                      );
                    })
                  }
                </ul>
              </li>
              <li><a className="externalLink" href="https://daostack.zendesk.com/hc" target="_blank" rel="noopener noreferrer">Help Center</a></li>
              <li><a className="externalLink" href="https://daotalk.org/" target="_blank" rel="noopener noreferrer">Get Involved</a></li>
              <li><Link to="/daos/create" onClick={this.handleCloseMenu}>Create A DAO</Link></li>
              <li><Link to="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link></li>
              <li className={css.daoStack}>
                <a className="externalLink" href="http://daostack.io" target="_blank" rel="noopener noreferrer">
                  <img src={(this.props.menuOpen || (this.props.daoAvatarAddress && this.props.data)) ?
                    "/assets/images/Icon/dao-logo.svg" : "/assets/images/Icon/dao-logo-gray.svg"} /> DAOstack
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

/***** DAO ETH Balance *****/
interface IEthProps extends ISubscriptionProps<BN|null> {
  dao: IDAOState;
}

const ETHBalance = (props: IEthProps) => {
  const { data } = props;
  return <li key="ETH"><strong>{formatTokens(data)}</strong> {baseTokenName()}</li>;
};

const SubscribedEthBalance = withSubscription({
  wrappedComponent: ETHBalance,
  loadingComponent: <li key="ETH">... {baseTokenName()}</li>,
  errorComponent: null,
  checkForUpdate: (oldProps: IEthProps, newProps: IEthProps) => {
    return oldProps.dao.address !== newProps.dao.address;
  },
  createObservable: async (props: IEthProps) => {
    return (await ethBalanceDao(props.dao.address)).pipe(ethErrorHandler());
  },
});

/***** Token Balance *****/
interface ITokenProps extends ISubscriptionProps<any> {
  dao: IDAOState;
  tokenAddress: string;
}
const TokenBalance = (props: ITokenProps) => {
  const { data, error, isLoading, tokenAddress } = props;

  const tokenData = supportedTokens()[tokenAddress];
  if (isLoading || error || ((data === null || isNaN(data) || data.isZero()) && tokenData.symbol !== genName())) {
    return null;
  }

  return (
    <li key={tokenAddress}>
      <strong>{formatTokens(data, tokenData["symbol"], tokenData["decimals"])}</strong>
    </li>
  );
};

const SubscribedTokenBalance = withSubscription({
  wrappedComponent: TokenBalance,
  checkForUpdate: (oldProps: ITokenProps, newProps: ITokenProps) => {
    return oldProps.dao.address !== newProps.dao.address || oldProps.tokenAddress !== newProps.tokenAddress;
  },
  createObservable: async (props: ITokenProps) => {
    // General cache priming for the DAO we do here
    // prime the cache: get all members fo this DAO -
    const daoState = props.dao;

    await Member.search(getArc(), {
      where: {
        dao: daoState.id,
      },
      first: 1000,
      skip: 0,
    }).pipe(first()).toPromise();

    const arc = getArc();
    const token = new Token(arc, props.tokenAddress);
    return token.balanceOf(props.dao.address).pipe(ethErrorHandler());
  },
});

const SubscribedSidebarMenu = withSubscription({
  wrappedComponent: SidebarMenu,
  checkForUpdate: ["daoAvatarAddress"],
  loadingComponent: <div></div>,
  createObservable: (props: IProps) => {
    if (props.daoAvatarAddress) {
      const arc = getArc();
      return arc.dao(props.daoAvatarAddress).state({ subscribe: true } );
    } else {
      return of(null);
    }
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SubscribedSidebarMenu);
