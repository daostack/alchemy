import * as classNames from "classnames";
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

    const circlesDAO = dao.name.toLowerCase().includes("circles");
    const iconClass = classNames({
      [css.daoAvatar]: true,
      [css.daoAvatarCircles]: circlesDAO
    });

    return (
      <div className={css.daoHeader + " " + css.clearfix}>
        <div className={css.daoInfo}>
          <Link to={"/dao/" + dao.avatarAddress}>
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
              <Link to={"/dao/" + dao.avatarAddress + "/members/"}>{Object.keys(dao.members).length} reputation holders</Link> with {Math.round(dao.reputationCount).toLocaleString()} {dao.name} reputation
            </div>
          </div>
        </div>
        <div className={css.holdings + " " + css.clearfix}>
          <h4>{dao.name} HOLDINGS</h4>
          { dao.externalTokenAddress ? <div>{dao.externalTokenCount} {dao.externalTokenSymbol}</div> : <div>{dao.ethCount} ETH </div> }
          <div>{dao.genCount} GEN</div>

        </div>
      </div>
    );
  }
}
