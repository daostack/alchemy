import * as React from "react";
import { Link } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IDaoState } from "reducers/arcReducer";

import * as css from "./DaoList.scss";

interface IStateProps {
  daosLoaded: boolean;
  daos: { [key: string]: IDaoState };
}

interface IDispatchProps {
  getDAOs: typeof arcActions.getDAOs;
}

type IProps = IStateProps & IDispatchProps;

export default class DaoList extends React.Component<IProps, null> {

  public componentDidMount() {
    this.props.getDAOs();
  }

  public render() {
    const { daos, daosLoaded } = this.props;

    const daoNodes = Object.keys(daos).map((key: string) => {
      const dao = daos[key];
      return (
        <Link className={css.daoLink} to={"/dao/" + dao.avatarAddress} key={"dao_" + dao.avatarAddress}>
          <div className={css.dao}>
            <div className={css.daoAvatar}>
              <img src="/assets/images/daostack-logo.png"/>
            </div>
            <h3 className={css.daoName}>{dao.name}</h3>
            <div className={css.daoInfo}>Token: {dao.tokenName} ({dao.tokenSymbol})</div>
            <div className={css.daoInfo}>Num tokens: {Math.round(dao.tokenCount).toLocaleString()}</div>
            <div className={css.daoInfo}>Reputation: {Math.round(dao.reputationCount).toLocaleString()}</div>
          </div>
        </Link>
      );
    });

    return (
      <div className={css.wrapper}>
        <div className={css.daoListHeader + " " + css.clearfix}>
          <h2>All DAOs</h2>
{/*          <Link to='/dao/create'>Create a New DAO</Link>*/}
        </div>
        {daoNodes ? daoNodes : "None"}
        {!daosLoaded ? <div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/></div> : ""}
      </div>
    );
  }
}
