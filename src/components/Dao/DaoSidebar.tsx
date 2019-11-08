import axios, { AxiosResponse } from "axios";
import { IDAOState, Token } from "@daostack/client";
import { from } from "rxjs";
import { getArc } from "arc";
import Loading from "components/Shared/Loading";

import BN = require("bn.js");
import * as classNames from "classnames";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import * as GeoPattern from "geopattern";
import { ethErrorHandler, formatTokens, getExchangesList, supportedTokens } from "lib/util";
import * as React from "react";
import { Link } from "react-router-dom";
import { first } from "rxjs/operators";
import { IRootState } from "reducers";
import { connect } from "react-redux";
import * as uiActions from "actions/uiActions";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import * as css from "./Dao.scss";

interface IExternalProps {
  dao: IDAOState;
}

interface IStateProps {
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

type IProps = IExternalProps & IStateProps & IDispatchProps & ISubscriptionProps<IHasNewPosts>;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {
  return {
    ...ownProps,
    menuOpen: state.ui.menuOpen,
  };
};

class DaoSidebar extends React.Component<IProps, IStateProps> {

  constructor(props: IProps) {
    super(props);
  }

  private handleCloseMenu = () => (_event: any): void => {
    this.props.hideMenu();
  }

  public render(): RenderOutput {
    const dao = this.props.dao;
    const hasNewPosts = this.props.data.hasNewPosts;
    const daoHoldingsAddress = "https://etherscan.io/tokenholdings?a=" + dao.address;
    const bgPattern = GeoPattern.generate(dao.address + dao.name);

    const menuClass = classNames({
      [css.menuOpen]: this.props.menuOpen,
      [css.daoSidebar]: true,
      clearfix: true,
    });

    return (
      <div className={menuClass}>
        <div className={css.daoNavigation}>
          <div className={css.daoName}>
            <Link to={"/dao/" + dao.address} onClick={this.handleCloseMenu()}>
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
          <div className={css.navigation}>
            <span className={css.navHeading}><b>Menu</b></span>
            <ul>
              <li>
                <Link to={"/dao/" + dao.address} onClick={this.handleCloseMenu()}>
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
                <TrainingTooltip placement="topLeft" overlay={"List of entities (DAOs and individuals) that have voting power in the Genesis DAO"}>
                  <Link to={"/dao/" + dao.address + "/members/"} onClick={this.handleCloseMenu()}>
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
                <Link to={"/dao/" + dao.address + "/history/"} onClick={this.handleCloseMenu()}>
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
                  <Link to={"/dao/" + dao.address + "/discussion/"} onClick={this.handleCloseMenu()}>
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
            <span className={css.navHeading}>
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
          <div className={css.menuWrapper}>
            <ul>
              <li><Link to="/" onClick={this.handleCloseMenu()}>Home</Link></li>
              <li>
                <a>Buy GEN</a>
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
              <li><a href="https://cloudflare-ipfs.com/ipfs/Qmf4HafH1QiryBun7j2g9inp78Njrkt635WJ943rBQyWyy" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
              <li className={css.daoStack}>
                <a href="http://daostack.io" target="_blank" rel="noopener noreferrer">
                  <img src="/assets/images/Icon/dao-logo.svg" /> DAOstack
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

const SubscribedDaoSidebar = withSubscription({
  wrappedComponent: DaoSidebar,
  checkForUpdate: (oldProps, newProps) => { return oldProps.dao.address !== newProps.dao.address; },
  loadingComponent: <div className={css.loading}><Loading/></div>,
  createObservable: (props: IProps) => {

    const lastAccessDate = localStorage.getItem(`daoWallEntryDate_${props.dao.address}`) || "0";

    const promise = axios.get(`https://disqus.com/api/3.0/threads/listPosts.json?api_key=KVISHbDLtTycaGw5eoR8aQpBYN8bcVixONCXifYcih5CXanTLq0PpLh2cGPBkM4v&forum=${process.env.DISQUS_SITE}&thread:ident=${props.dao.address}&since=${lastAccessDate}&limit=1&order=asc`)
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
    return from(promise);
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SubscribedDaoSidebar);
