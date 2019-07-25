import { Address, IDAOState, Token } from "@daostack/client";
import { getArc } from "arc";

import BN = require("bn.js");
import * as classNames from "classnames";
import Loading from "components/Shared/Loading";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import * as GeoPattern from "geopattern";
import gql from "graphql-tag";
import { formatTokens, getExchangesList, supportedTokens } from "lib/util";
import * as React from "react";
import { Link } from "react-router-dom";
import { NavLink } from "react-router-dom";
import * as css from "./Dao.scss";

interface IProps {
  dao: IDAOState;
  proposals: any[];
}

interface IState {
  openMenu: boolean;
}

class DaoSidebar extends React.Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
    this.state = {
      openMenu: false,
    };
  }

  public handleOpenMenu(_event: any): void {
    this.setState({ openMenu: !this.state.openMenu });
  }

  public render(): any {
    const dao = this.props.dao;
    const proposalCount = this.props.proposals.length;

    const arc = getArc();

    const daoHoldingsAddress = "https://etherscan.io/tokenholdings?a=" + dao.address;

    const bgPattern = GeoPattern.generate(dao.address + dao.name);

    const menuClass = classNames({
      [css.openMenu]: this.state.openMenu,
      [css.daoSidebar]: true,
      clearfix: true,
    });

    return (
      <div className={menuClass}>
        <div className={css.menuToggle} onClick={this.handleOpenMenu.bind(this)}>
          <img className={css.menuClosed} src="/assets/images/Icon/Menu.svg"/>
          <img className={css.menuOpen} src="/assets/images/Icon/Close.svg"/>
        </div>
        <div className={css.daoNavigation}>
          <div className={css.daoName}>
            <Link to={"/dao/" + dao.address}>
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
                <Link to={"/dao/" + dao.address}>
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
                <Link to={"/dao/" + dao.address + "/members/"}>
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
              </li>
              <li>
                <NavLink activeClassName={css.selected} to={"/dao/" + dao.address + "/history/"}>
                  <span className={css.menuDot} />
                  <span className={
                    classNames({
                      [css.notification]: true,
                      [css.historyNotification]: true,
                    })
                  }></span>
                  <img src="/assets/images/Icon/menu/history.svg" />
                  History
                </NavLink>
              </li>
              <li>
                <NavLink activeClassName={css.selected} to={"/dao/" + dao.address + "/redemptions/"}>
                  <span className={
                    classNames({
                      [css.menuDot]: true,
                      [css.red]: !!proposalCount,
                    })
                  } />
                  <span className={
                    classNames({
                      [css.notification]: true,
                      [css.redemptionNotification]: true,
                    })
                  }></span>
                  <img src="/assets/images/Icon/menu/redemption.svg" />
                  Redemptions ({proposalCount})
                </NavLink>
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
              <Subscribe observable={arc.dao(dao.address).ethBalance()}>{
                (state: IObservableState<BN>) => {
                  if (state.isLoading) {
                    return <li key="ETH">... ETH</li>;
                  } else if (state.error) {
                    return "";
                  } else {
                    return <li key="ETH"><strong>{formatTokens(new BN(state.data))}</strong> ETH</li>;
                  }
                }
              }</Subscribe>

              {Object.keys(supportedTokens()).map((tokenAddress) => {
                const token = new Token(tokenAddress, arc);
                const tokenData = supportedTokens()[tokenAddress];
                return <Subscribe key={tokenAddress} observable={token.balanceOf(dao.address)}>{
                  (state: IObservableState<BN>) => {
                    if (state.isLoading || state.error || (state.data.isZero() && tokenData.symbol !== "GEN")) {
                      return "";
                    } else {
                      return (
                        <li key={tokenAddress}>
                          <strong>{formatTokens(state.data, tokenData["symbol"], tokenData["decimals"])}</strong>
                        </li>
                      );
                    }
                  }
                }</Subscribe>;
              })}
            </ul>
          </div>
          <div className={css.menuWrapper}>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><a href="https://docs.google.com/document/d/1M1erC1TVPPul3V_RmhKbyuFrpFikyOX0LnDfWOqO20Q/" target="_blank" rel="noopener noreferrer">FAQ</a></li>
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
              <li><a href="https://medium.com/daostack/new-introducing-alchemy-budgeting-for-decentralized-organizations-b81ba8501b23" target="_blank" rel="noopener noreferrer">Alchemy 101</a></li>
              <li><a href="https://www.daostack.io/" target="_blank" rel="noopener noreferrer">About DAOstack</a></li>
              <li><a href="https://www.daostack.io/community" target="_blank" rel="noopener noreferrer">Get involved</a></li>
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

export default (props: { dao: IDAOState; currentAccountAddress?: Address }) => {
  const daoState = props.dao;

  if (!daoState) {
    return null;
  } else if (!props.currentAccountAddress) {
    return <DaoSidebar dao={daoState} proposals={[]} />;
  } else {
    const query = gql`       {
    proposals(where: {
      accountsWithUnclaimedRewards_contains: ["${props.currentAccountAddress}"]
      dao: "${props.dao.address}"
    }) {
      id
      }
    }
    `;
    const arc = getArc();

    return <Subscribe observable={arc.getObservable(query)}>{(state: IObservableState<any>) => {
      if (state.error) {
        return <div>{state.error.message}</div>;
      } else if (state.data) {
        return <DaoSidebar dao={daoState} proposals={state.data.data.proposals} />;
      } else {
        return (<div className={css.loading}><Loading /></div>);
      }
    }
    }</Subscribe>;
  }
};
