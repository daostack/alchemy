import * as classNames from "classnames";
import * as React from "react";
import { Link } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import Subscribe from "components/Shared/Subscribe"
import { IRootState } from "reducers";
import { IDaoState } from "reducers/arcReducer";
import { IDAOState } from '@daostack/client'
import { arc } from "arc";

import * as css from "./ViewDao.scss";

interface IProps {
  address: string
}

export default class DaoHeader extends React.Component<IProps, null> {

  public render() {
    const { address} = this.props
    return (
      <Subscribe observable={arc.dao(address).state}>{
          ({ complete, data, error }: any): any => {
            const dao = data as IDAOState;
            if (dao) {
              const circlesDAO = dao.name.toLowerCase().includes("circles");

              const iconClass = classNames({
                  [css.daoAvatar]: true,
                  [css.daoAvatarCircles]: circlesDAO
                });

              return <div className={css.daoHeader + " " + css.clearfix}>
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
                        <Link to={"/dao/" + dao.address + "/members/"}>{Object.keys(dao.members).length} reputation holders</Link> with {Math.round(dao.reputationTotalSupply).toLocaleString()} {dao.name} reputation
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
                      (state: any) => {
                        if (state.data) {
                          return <div>{state.data } GEN</div>
                        } else {
                          return null
                        }
                      }
                    }</Subscribe>
                  </div>
                </div>
              } else {
                return null
              }
            }
      }</Subscribe>
    )
  }
}
