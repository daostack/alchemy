import { denormalize } from "normalizr";
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link } from "react-router-dom";
import Subscribe from "components/Shared/Subscribe"
import { arc } from "arc"
import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IDAOState } from "@daostack/client";

import * as schemas from "schemas";

import * as css from "./DaoList.scss";

interface IProps {
  address: string
}

class DaoContainer extends React.Component<IProps, null> {
  public render() {
    const { address } = this.props

    return  (
      <Subscribe observable={arc.dao(address).state}>{
          ({ complete, data, error }: any): any => {
            if (data) {
              const dao = data
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
            } else {
                return null
            }
          }
        }
      </Subscribe>
    )
  }
}

export default DaoContainer
