import BN = require("bn.js");
import * as classNames from "classnames";
import * as React from "react";
import { Link } from "react-router-dom";
import { NavLink } from "react-router-dom";

import { IRootState } from "reducers";
import { IDAOState } from "@daostack/client";
import { getArc } from "arc";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import Util from "lib/util";

import DaoHeadings from "./DaoHeadings";

import * as css from "./ViewDao.scss";

interface IProps {
  dao: IDAOState;
}

class DaoSidebarComponent extends React.Component<IProps, null> {

  public render() {
    const dao = this.props.dao;
    const circlesDAO = dao.name.toLowerCase().includes("circles");

    const iconClass = classNames({
        [css.daoAvatar]: true,
        [css.daoAvatarCircles]: circlesDAO
      });

    const arc = getArc();

    return (
      <div className={css.daoSidebar + " " + css.clearfix}>
        <div className={css.daoNavigation}>
          <div className={css.daoName}>
            <Link to={"/dao/" + dao.address}>{dao.name}</Link>
            <p>Anyone can make a proposal to the DAO! Click the button on the bottom right.</p>
          </div>
          {
            // TODO: temporarilby disabled DaoHeadings - needs refactor to use IDAOState
            // <DaoHeadings dao={dao} />
            }
          <div className={css.navigation}>
            <span className={css.navHeading}><b>Menu</b></span>
            <ul>
              <li>
                <Link to={"/dao/" + dao.address}>Home</Link>
              </li>
              <li>
                <Link to={"/dao/" + dao.address + "/members/"}>Reputation Holders</Link>
              </li>
              <li>
                  <NavLink activeClassName={css.selected} to={"/dao/" + dao.address + "/history/"}>History</NavLink>
              </li>
              <li>
                <NavLink activeClassName={css.selected} to={"/dao/" + dao.address + "/redemptions/"}>Redemptions</NavLink>
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
                    return <li><strong>{ Util.fromWei(state.data) }</strong> ETH</li>;
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
                    return <li><strong>{ Util.fromWei(state.data) }</strong> GEN</li>;
                  }
                }
              }</Subscribe>
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

export default (props: { address: string}) => {
  const arc = getArc();
  return <Subscribe observable={arc.dao(props.address).state}>{(state: IObservableState<IDAOState>) => {
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
