import axios, { AxiosResponse } from "axios";
import { IDAOState, Token } from "@daostack/client";
import * as uiActions from "actions/uiActions";
import { getArc } from "arc";
import Loading from "components/Shared/Loading";
import TrainingTooltip from "components/Shared/TrainingTooltip";

import BN = require("bn.js");
import * as classNames from "classnames";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import * as GeoPattern from "geopattern";
import { ethErrorHandler, formatTokens, getExchangesList, supportedTokens } from "lib/util";
import * as queryString from "query-string";
import * as React from "react";
import { matchPath, Link, RouteComponentProps } from "react-router-dom";
import { first } from "rxjs/operators";
import { IRootState } from "reducers";
import { connect } from "react-redux";
import { combineLatest, of, from } from "rxjs";

import * as css from "./SidebarMenu.scss";

type IExternalProps = RouteComponentProps<any>;

interface IStateProps {
  daoAvatarAddress: string;
  menuOpen: boolean;
}

interface IHasNewPosts {
  hasNewPosts: boolean;
}

interface IDispatchProps {
  hideMenu: typeof uiActions.hideMenu;
}

const mapDispatchToProps = {
  hideMenu: uiActions.hideMenu,
};

type IProps = IExternalProps & IStateProps & IDispatchProps & ISubscriptionProps<[IDAOState, IHasNewPosts]>;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {
  const match = matchPath(ownProps.location.pathname, {
    path: "/dao/:daoAvatarAddress",
    strict: false,
  });
  const queryValues = queryString.parse(ownProps.location.search);

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

  private handleCloseMenu = (_event: any): void => {
    this.props.hideMenu();
  }

  public daoMenu() {
    const [ dao, { hasNewPosts } ] = this.props.data ;

    const daoHoldingsAddress = "https://etherscan.io/tokenholdings?a=" + dao.address;
    const bgPattern = GeoPattern.generate(dao.address + dao.name);

    return (
      <div>
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
              <a href="https://cloudflare-ipfs.com/ipfs/QmRQhXUKKfUCgsAf5jre18T3bz5921fSfvnZCB5rR8mCKj" target="_blank" rel="noopener noreferrer">Participation Agreement</a>, which includes the terms of participation in the dxDAO
            </p>
            : dao.name === "Meme" ?
              <p><a href="https://docs.google.com/document/d/1iJZfjmOK1eZHq-flmVF_44dZWNsN-Z2KAeLqW3pLQo8" target="_blank" rel="noopener noreferrer">Learn how to MemeDAO</a></p>
              : dao.name === "ETHBerlin dHack.io" ?
                <p>
                For more info join our TG group -
                  <a href="https://t.me/dhack0" target="_blank" rel="noopener noreferrer">t.me/dhack0</a>
                </p>
                : dao.name === "Identity" ?
                  <p>
                A curated registry of identities on the Ethereum blockchain.&nbsp;
                    <a href="https://docs.google.com/document/d/1_aS41bvA6D83aTPv6QNehR3PfIRHJKkELnU76Sds5Xk" target="_blank" rel="noopener noreferrer">How to register.</a>
                  </p>
                  : <p>Anyone can make a proposal to the DAO! Click the button on the top right.</p>
          }
        </div>
        <div className={css.daoNavigation}>
          <span className={css.daoNavHeading}><b>Menu</b></span>
          <ul>
            <li>
              <Link to={"/dao/" + dao.address} onClick={this.handleCloseMenu}>
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
              <TrainingTooltip placement="topLeft" overlay={"List of entities (DAOs and individuals) that have voting power in the DAO"}>
                <Link to={"/dao/" + dao.address + "/members/"} onClick={this.handleCloseMenu}>
                  <span className={css.menuDot} />
                  <span className={
                    classNames({
                      [css.notification]: true,
                      [css.holdersNotification]: true,
                    })
                  }></span>
                  <img src="/assets/images/Icon/menu/holders.svg" />
                Reputation Holders
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
            <li>
              <TrainingTooltip placement="topLeft" overlay={"Space designated for general questions, statements and comments"}>
                <Link to={"/dao/" + dao.address + "/discussion/"} onClick={this.handleCloseMenu}>
                  <span className={
                    classNames({
                      [css.menuDot]: true,
                      [css.red]: hasNewPosts,
                    })} />
                  <span className={
                    classNames({
                      [css.notification]: true,
                      [css.discussionNotification]: true,
                    })
                  }></span>
                  <img src="/assets/images/Icon/menu/chat.svg" />
                DAO Wall
                </Link>
              </TrainingTooltip>
            </li>
          </ul>
        </div>
        <div className={css.daoHoldings}>
          <span className={css.daoNavHeading}>
            <b>DAO Holdings</b>
            <a href={daoHoldingsAddress}>
              <img src="/assets/images/Icon/link-white.svg" />
            </a>
          </span>
          <ul>
            <SubscribedEthBalance dao={dao} />

            {Object.keys(supportedTokens()).map((tokenAddress) => {
              return <SubscribedTokenBalance tokenAddress={tokenAddress} dao={dao} key={"token_" + tokenAddress} />;
            })}
          </ul>
        </div>
      </div>
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
                <TrainingTooltip overlay="List of all DAOs accessible by Alchemy" placement="right">
                  <Link to="/daos" onClick={this.handleCloseMenu}>All DAOs</Link>
                </TrainingTooltip>
              </li>
              <li>
                <a>$ Buy GEN</a>
                <ul>
                  <div className={css.diamond}></div>
                  {
                    getExchangesList().map((item: any) => {
                      return (
                        <li key={item.name}>
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            <b><img src={item.logo} /></b>
                            <span>{item.name}</span>
                          </a>
                        </li>
                      );
                    })
                  }
                </ul>
              </li>
              <li><a href="https://daostack.zendesk.com/hc" target="_blank" rel="noopener noreferrer">Help Center</a></li>
              <li><a href="https://hub.gendao.org/" target="_blank" rel="noopener noreferrer">Get Involved</a></li>
              <li><Link to="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link></li>
              <li className={css.daoStack}>
                <a href="http://daostack.io" target="_blank" rel="noopener noreferrer">
                  <img src={this.props.daoAvatarAddress ? "/assets/images/Icon/dao-logo.svg" : "/assets/images/Icon/dao-logo-gray.svg"} /> DAOstack
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
  return <li key="ETH"><strong>{formatTokens(data)}</strong> ETH</li>;
};

const SubscribedEthBalance = withSubscription({
  wrappedComponent: ETHBalance,
  loadingComponent: <li key="ETH">... ETH</li>,
  errorComponent: null,
  checkForUpdate: (oldProps: IEthProps, newProps: IEthProps) => {
    return oldProps.dao.address !== newProps.dao.address;
  },
  createObservable: (props: IEthProps) => {
    const arc = getArc();
    return arc.dao(props.dao.address).ethBalance().pipe(ethErrorHandler());
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
  if (isLoading || error || ((data === null || isNaN(data) || data.isZero()) && tokenData.symbol !== "GEN")) {
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

    await daoState.dao.members({ first: 1000, skip: 0 }).pipe(first()).toPromise();

    const arc = getArc();
    const token = new Token(props.tokenAddress, arc);
    return token.balanceOf(props.dao.address).pipe(ethErrorHandler());
  },
});

const SubscribedSidebarMenu = withSubscription({
  wrappedComponent: SidebarMenu,
  checkForUpdate: ["daoAvatarAddress"],
  loadingComponent: <div className={css.loading}><Loading/></div>,
  createObservable: (props: IProps) => {
    if (props.daoAvatarAddress) {
      const lastAccessDate = localStorage.getItem(`daoWallEntryDate_${props.daoAvatarAddress}`) || "0";

      const promise = axios.get(`https://disqus.com/api/3.0/threads/listPosts.json?api_key=KVISHbDLtTycaGw5eoR8aQpBYN8bcVixONCXifYcih5CXanTLq0PpLh2cGPBkM4v&forum=${process.env.DISQUS_SITE}&thread:ident=${props.daoAvatarAddress}&since=${lastAccessDate}&limit=1&order=asc`)
        .then((response: AxiosResponse<any>): IHasNewPosts => {
          if (response.status) {
            const posts = response.data.response;
            return { hasNewPosts : posts && posts.length };
          } else {
            // eslint-disable-next-line no-console
            console.error(`request for disqus posts failed: ${response.statusText}`);
            return { hasNewPosts : false };
          }
        })
        .catch((error: Error): IHasNewPosts => {
          // eslint-disable-next-line no-console
          console.error(`request for disqus posts failed: ${error.message}`);
          return { hasNewPosts : false };
        });

      const arc = getArc();
      return combineLatest(arc.dao(props.daoAvatarAddress).state({ subscribe: true }), from(promise));
    } else {
      return of(null);
    }
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SubscribedSidebarMenu);
