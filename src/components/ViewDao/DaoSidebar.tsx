import { IDAOState } from "@daostack/client";
import { getArc } from "arc";
import BN = require("bn.js");
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import * as GeoPattern from "geopattern";
import { formatTokens } from "lib/util";
import * as React from "react";
import { Link } from "react-router-dom";
import { NavLink } from "react-router-dom";
import * as css from "./ViewDao.scss";

interface IProps {
  dao: IDAOState;
}

class DaoSidebarComponent extends React.Component<IProps, null> {

  public render() {
    const dao = this.props.dao;

    const arc = getArc();

    const daoHoldingsAddress = "https://etherscan.io/tokenholdings?a=" + dao.address;

    const bgPattern = GeoPattern.generate(dao.address + dao.name);

    return (
      <div className={css.daoSidebar + " clearfix"}>
        <div className={css.daoNavigation}>
          <div className={css.daoName}>
            <Link to={"/dao/" + dao.address}>
              <b className={css.daoIcon} style={{backgroundImage: bgPattern.toDataUrl()}}></b>
              <span>{dao.name}</span>
            </Link>
          </div>
          <div className={css.daoDescription}>
            { dao.name === "Meme" ?
                <p><a href="https://docs.google.com/document/d/1iJZfjmOK1eZHq-flmVF_44dZWNsN-Z2KAeLqW3pLQo8" target="_blank">Learn how to MemeDAO</a></p>
              : dao.name === "Identity" ?
                <p>
                  A curated registry of identities on the Ethereum blockchain.&nbsp;
                  <a href="https://docs.google.com/document/d/1_aS41bvA6D83aTPv6QNehR3PfIRHJKkELnU76Sds5Xk" target="_blank">How to register.</a>
                </p>
              : <p>Anyone can make a proposal to the DAO! Click the button on the top right.</p>
            }
          </div>
          <div className={css.navigation}>
            <span className={css.navHeading}><b>Menu</b></span>
            <ul>
              <li>
                <Link to={"/dao/" + dao.address}>
                  <span className={css.notification + " " + css.homeNotification}></span>
                  <img src="/assets/images/Icon/menu/home.svg"/>
                  Home
                </Link>
              </li>
              <li>
                <Link to={"/dao/" + dao.address + "/members/"}>
                <span className={css.notification + " " + css.holdersNotification}></span>
                <img src="/assets/images/Icon/menu/holders.svg"/>
                  Reputation Holders
                 </Link>
              </li>
              <li>
                  <NavLink activeClassName={css.selected} to={"/dao/" + dao.address + "/history/"}>
                    <span className={css.notification + " " + css.historyNotification}></span>
                    <img src="/assets/images/Icon/menu/history.svg"/>
                    History
                  </NavLink>
              </li>
              <li>
                <NavLink activeClassName={css.selected} to={"/dao/" + dao.address + "/redemptions/"}>
                  <span className={css.notification + " " + css.redemptionNotification}></span>
                  <img src="/assets/images/Icon/menu/redemption.svg"/>
                  Redemptions
                 </NavLink>
              </li>
            </ul>
          </div>
          <div className={css.daoHoldings}>
            <span className={css.navHeading}>
              <b>DAO Holdings</b>
              <a href={daoHoldingsAddress}>
                <img src="/assets/images/Icon/link-white.svg"/>
              </a>
             </span>
            <ul>
              <Subscribe observable={arc.dao(dao.address).ethBalance()}>{
                (state: IObservableState<BN>) => {
                  if (state.isLoading) {
                    return <li>... ETH</li>;
                  } else if ( state.error) {
                    return <li>{ state.error.message}</li>;
                  } else {
                    return <li><strong>{ formatTokens(new BN(state.data)) }</strong> ETH</li>;
                  }
                }
              }</Subscribe>
              <Subscribe observable={arc.GENToken().balanceOf(dao.address)}>{
                (state: IObservableState<BN>) => {
                  if (state.isLoading) {
                    return <li>... GEN</li>;
                  } else if ( state.error) {
                    return <li>{ state.error.message}</li>;
                  } else {
                    return <li><strong>{ formatTokens(state.data) }</strong> GEN</li>;
                  }
                }
              }</Subscribe>
            </ul>
          </div>
          <div className={css.menuWrapper}>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><a href="https://docs.google.com/document/d/1M1erC1TVPPul3V_RmhKbyuFrpFikyOX0LnDfWOqO20Q/" target="_blank">FAQ</a></li>
                <li>
                  <a>Buy GEN</a>
                  <ul>
                    <div className={css.diamond}></div>
                    <li>
                      <a href="https://www.bitfinex.com/" target="_blank">
                        <b><img src="/assets/images/Exchanges/bitfinex.png"/></b>
                        <span>Bitfinex</span>
                      </a>
                    </li>
                    <li>
                      <a href="https://www.ethfinex.com/" target="_blank">
                        <b><img src="/assets/images/Exchanges/ethfinex.svg"/></b>
                        <span>Ethfinex</span>
                      </a>
                    </li>
                    <li>
                      <a href="https://idex.market/eth/gen" target="_blank">
                        <b><img src="/assets/images/Exchanges/idex.png"/></b>
                        <span>IDEX</span>
                      </a>
                    </li>
                    <li>
                      <a href="https://slow.trade" target="_blank">
                        <b><img src="https://slow.trade/favicon-32x32.png"/></b>
                        <span>Slow Trade</span>
                      </a>
                    </li>
                  </ul>
                </li>
                <li><a href="https://medium.com/daostack/new-introducing-alchemy-budgeting-for-decentralized-organizations-b81ba8501b23" target="_blank">Alchemy 101</a></li>
                <li><a href="https://www.daostack.io/" target="_blank">About DAOstack</a></li>
                <li><a href="https://www.daostack.io/community" target="_blank">Get involved</a></li>
                <li className={css.daoStack}>
                  <a href="http://daostack.io" target="_blank">
                    <img src="/assets/images/Icon/dao-logo.svg"/> DAOstack
                  </a>
                </li>
              </ul>
            </div>
        </div>
      </div>
    );
  }
}

export default (props: { address: string}) => {
  const arc = getArc();
  return <Subscribe observable={arc.dao(props.address).state()}>{(state: IObservableState<IDAOState>) => {
      const daoState = state.data;
      if (state.error) {
        throw state.error;
      } else if (daoState) {
        return <DaoSidebarComponent dao={daoState} />;
      } else {
        return null;
      }
    }
  }</Subscribe>;
};
