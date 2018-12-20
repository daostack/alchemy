import * as classNames from "classnames";
import * as React from "react";
import { Link } from "react-router-dom";

import { IRootState } from "reducers";
import { IDAOState } from '@daostack/client'
import { arc } from "arc";
import Subscribe, { IObservableState } from "components/Shared/Subscribe"

import * as css from "./ViewDao.scss";

interface IProps {
  dao: IDAOState
}

class DaoHeaderComponent extends React.Component<IProps, null> {

  public render() {
    const dao = this.props.dao
    const circlesDAO = dao.name.toLowerCase().includes("circles");

    const iconClass = classNames({
        [css.daoAvatar]: true,
        [css.daoAvatarCircles]: circlesDAO
      });

    return (
      <div className={css.daoHeader + " " + css.clearfix}>
      <div className={css.daoInfo}>
        <Link to={"/dao/" + dao.address}>
          <div className={iconClass}>
            { circlesDAO
              ? <img src="/assets/images/circles_logo.png"/>
              : <img src="/assets/images/daostack-logo.png"/>
            }
          </div>
        </Link>
        <div className={css.daoDescription}>
          <div className={css.daoName}>
            {dao.name}
          </div>
          <div className={css.daoReputationInfo}>
            <img src="/assets/images/Icon/Members.svg"/>
            <Link to={"/dao/" + dao.address + "/members/"}>{dao.memberCount} reputation holders</Link> with {Math.round(dao.reputationTotalSupply).toLocaleString()} {dao.name} reputation
          </div>
        </div>
      </div>
      <div className={css.holdings + " " + css.clearfix}>
        <h4>{dao.name} HOLDINGS</h4>
        {
        // TODO: show ETH balance
        // { dao.externalTokenAddress ? <div>{dao.externalTokenCount} {dao.externalTokenSymbol}</div> : <div>{dao.ethCount} ETH </div> }
        }
        <div><b>TBD</b> ETH </div>
        <Subscribe observable={dao.token.balanceOf(dao.address)}>{
          (state: IObservableState<number>) => {
            if (state.data) {
              return <div>{state.data } GEN</div>
            } else {
              return null
            }
          }
        }</Subscribe>
      </div>
    </div>
    )
  }
}

export default (props: { address: string}) =>
  <Subscribe observable={arc.dao(props.address).state}>{(state: IObservableState<IDAOState>) => {
      const daoState = state.data
      if (daoState) {
        return <DaoHeaderComponent dao={daoState} />
      } else {
        return null
      }
    }
  }</Subscribe>
