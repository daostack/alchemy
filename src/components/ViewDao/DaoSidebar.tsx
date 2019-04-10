import { IDAOState } from "@daostack/client";
import { getArc } from "arc";
import BN = require("bn.js");
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
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

    return (
      <div className={css.daoSidebar + " " + css.clearfix}>
        <div className={css.daoNavigation}>
          <div className={css.daoName}>
            <Link to={"/dao/" + dao.address}>
              <b className={css.daoIcon}></b>
              <span>{dao.name}</span>
            </Link>
            <p>Anyone can make a proposal to the DAO! Click the button on the top right.</p>
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
{/*                TODO: Make this notification work!
                  <span className={css.notification + " " + css.redemptionNotification}></span>
*/}
                  <img src="/assets/images/Icon/menu/redemption.svg"/>
                  Redemptions
                 </NavLink>
              </li>
            </ul>
          </div>
          <div className={css.daoHoldings}>
            <span className={css.navHeading}><b>DAO Holdings</b></span>
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
                <li><Link to="/daos">View DAOs</Link></li>
                <li><a href="https://docs.google.com/document/d/1M1erC1TVPPul3V_RmhKbyuFrpFikyOX0LnDfWOqO20Q/" target="_blank">FAQ</a></li>
                <li>
                  <a>Buy GEN</a>
                  <ul>
                    <li><a href="https://slow.trade" target="_blank"><img src="https://slow.trade/favicon-32x32.png"/> Slow Trade</a></li>
                    <li><a href="https://idex.market/eth/gen" target="_blank"><img src="/assets/images/Exchanges/idex.png"/> IDEX</a></li>
                    <li><a href="https://ddex.io/trade/GEN-ETH" target="_blank"><img src="/assets/images/Exchanges/ddex.png"/> DDEX</a></li>
                    <li><a href="https://forkdelta.github.io/#!/trade/0x543ff227f64aa17ea132bf9886cab5db55dcaddf-ETH" target="_blank"><img src="/assets/images/Exchanges/forkdelta.png"/> Forkdelta</a></li>
                    <li><a href="https://etherdelta.com/#0x543ff227f64aa17ea132bf9886cab5db55dcaddf-ETH" target="_blank"><img src="/assets/images/Exchanges/etherdelta.png"/> Etherdelta</a></li>
                    <li><a href="https://www.hotbit.io/exchange?symbol=GEN_ETH" target="_blank"><img src="/assets/images/Exchanges/hotbit.png"/> Hotbit</a></li>
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
