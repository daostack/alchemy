import * as React from "react";
import { Link } from "react-router-dom";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import { getArc } from "arc";
import Util from "lib/util";

import * as css from "./DaoList.scss";
import { IDAOState } from "@daostack/client";

interface IProps {
  address: string;
}

const DaoContainer = (props: IProps) => {
  const { address } = props;
  const arc = getArc();

  return <Subscribe observable={arc.dao(address).state()}>{(state: IObservableState<IDAOState>) => {
      if (state.isLoading) {
        return null;
      } else if (state.error) {
        throw state.error;
      } else {
        const dao = state.data;
        return <Link
          className={css.daoLink}
          to={"/dao/" + dao.address}
          key={"dao_" + dao.address}
          data-test-id="dao-link"
        >
          <div className={css.dao}>
            <h3 className={css.daoName}>{dao.name}</h3>

            <div className={css.clearfix + " " + css.daoInfoContainer}>
              <div className={css.daoInfoTitle}>
                Monthly Activity
              </div>
              <Subscribe observable={dao.token.state()}>{ (state: any) =>  (state.data &&
                  <div>
                    <div className={css.daoInfo}>
                      <b>{state.data.symbol}</b>
                      <span>Token</span>
                     </div>
                    <div className={css.daoInfo}>
                      <b>{Util.fromWei(state.data.totalSupply).toLocaleString()}</b>
                      <span>Num tokens</span>
                     </div>
                  </div>
              )}</Subscribe>
              <Subscribe observable={dao.reputation.state()}>{ (state: any) =>  (state.data &&
                <div className={css.daoInfo}>
                  <b>{Util.fromWei(state.data.totalSupply).toLocaleString()}</b>
                  <span>Reputation</span>
                </div>
              )}</Subscribe>
            </div>
          </div>
        </Link>;
      }
    }
  }</Subscribe>;
};

export default DaoContainer;
