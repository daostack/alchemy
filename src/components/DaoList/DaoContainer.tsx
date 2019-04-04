import { IDAOState } from "@daostack/client";
import { getArc } from "arc";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import { formatTokens } from "lib/util";
import * as React from "react";
import { Link } from "react-router-dom";
import * as css from "./DaoList.scss";

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
        return <div>{ state.error.message }</div>;
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
                      <b>{formatTokens(state.data.totalSupply)}</b>
                      <span>Num tokens</span>
                     </div>
                  </div>
              )}</Subscribe>
              <Subscribe observable={dao.reputation.state()}>{ (state: any) =>  (state.data &&
                <div className={css.daoInfo}>
                  <b>{formatTokens(state.data.totalSupply)}</b>
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
