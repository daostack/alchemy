import * as React from "react";
import { Link } from "react-router-dom";
import Subscribe, { IObservableState } from "components/Shared/Subscribe"
import { getArc } from "arc"

import * as css from "./DaoList.scss";
import { IDAOState } from "@daostack/client"

interface IProps {
  address: string
}

const DaoContainer = (props: IProps) => {
  const { address } = props
  const arc = getArc()

  return <Subscribe observable={arc.dao(address).state}>{(state: IObservableState<IDAOState>) => {
      if (state.isLoading) {
        return null
      } else if (state.error) {
        throw state.error
      } else {
        const dao = state.data
        return <Link
          className={css.daoLink}
          to={"/dao/" + dao.address}
          key={"dao_" + dao.address}
          data-test-id="dao-link"
        >
          <div className={css.dao}>
            <div className={css.daoAvatar}>
              <img src="/assets/images/daostack-logo.png"/>
            </div>
            <h3 className={css.daoName}>{dao.name}</h3>
            <Subscribe observable={dao.token.state}>{ (state: any) =>  (state.data &&
              <div>
                <div className={css.daoInfo}>Token: {state.data.name } ({state.data.symbol})</div>
                <div className={css.daoInfo}>Num tokens: {Math.round(state.data.totalSupply).toLocaleString()}</div>
              </div>
            )}</Subscribe>
            <Subscribe observable={dao.reputation.state}>{ (state: any) =>  (state.data &&
              <div className={css.daoInfo}>Reputation: {Math.round(state.data.totalSupply).toLocaleString()}</div>
            )}</Subscribe>
          </div>
        </Link>
      }
    }
  }</Subscribe>
}

export default DaoContainer
