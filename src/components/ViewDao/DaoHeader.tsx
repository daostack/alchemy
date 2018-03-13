import * as React from "react";
import { Link } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IDaoState } from "reducers/arcReducer";

import * as css from "./ViewDao.scss";

interface IProps {
  dao: IDaoState;
}

export default class DaoHeader extends React.Component<IProps, null> {

  public render() {
    const { dao } = this.props;

    return (
      <div className={css.daoHeader + " " + css.clearfix}>
        <div className={css.daoInfo}>
          <div className={css.daoAvatar}>
            <img src="/assets/images/daostack-logo.png"/>
          </div>
          <div className={css.daoDescription}>
            <div className={css.daoName}>
              {dao.name}
              <button className={css.daoPrefs}>
                <img src="/assets/images/configure-dao-icon.svg"/>
              </button>
            </div>
            <div className={css.daoReputationInfo}>
              {Object.keys(dao.members).length} reputation holders with {Math.round(dao.reputationCount).toLocaleString()} {dao.name} reputation
            </div>
          </div>
        </div>
        <div className={css.genBox + " " + css.clearfix}>
          <div className={css.centered + " " + css.small}>
            PREDICTION TOKEN
          </div>
          <div className={css.genTitle}>
            {dao.tokenSymbol}
          </div>
          <div className={css.genStats}>
            <div className={css.caption + " " + css.leftAlign}>
              <div>{dao.tokenCount}</div>
              <div className={css.small}>IN CIRCULATION</div>
            </div>
          </div>
          <div className={css.buyGenContainer}>
            <Link to={"/dao/" + dao.avatarAddress} className={css.buyGen}>
              BUY
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
