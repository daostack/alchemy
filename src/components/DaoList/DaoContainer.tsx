import { IDAOState, IProposalStage, Proposal } from "@daostack/client";
import { getArc } from "arc";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import * as GeoPattern from "geopattern";
import * as React from "react";
import { Link } from "react-router-dom";
import { combineLatest } from "rxjs";

import * as css from "./DaoList.scss";

interface IProps {
  address: string;
}

const DaoContainer = (props: IProps) => {
  const { address } = props;
  const arc = getArc();
  const dao = arc.dao(address);
  const observable = combineLatest(
    dao.proposals({
      stage: IProposalStage.Queued,
      expiresInQueueAt_gt: Math.floor(new Date().getTime() / 1000)
    }), // the list of queued proposals
    dao.state() // DAO state
  );

  return <Subscribe observable={observable}>{(state: IObservableState<[Proposal[], IDAOState]>) => {
      if (state.isLoading) {
        return null;
      } else if (state.error) {
        return <div>{ state.error.message }</div>;
      } else {
        const dao = state.data[1];
        const bgPattern = GeoPattern.generate(dao.address + dao.name);

        return <Link
          className={css.daoLink}
          to={"/dao/" + dao.address}
          key={"dao_" + dao.address}
          data-test-id="dao-link"
        >
          <div className={css.dao}>
            <h3 className={css.daoName} style={{backgroundImage: bgPattern.toDataUrl()}}>{dao.name}</h3>

            <div className={css.clearfix + " " + css.daoInfoContainer}>
              <div className={css.daoInfoTitle}>
                Statistics
              </div>

              <div className={css.daoInfo}>
                <b>{dao.memberCount}</b>
                <span>Reputation Holders</span>
               </div>

              <div className={css.daoInfo}>
                <b>{state.data[0].length}</b>
                <span>Open Proposals</span>
               </div>

              <div className={css.daoInfo}>
                <b>TODO</b>
                <span>GEN Staked</span>
              </div>
              )
            </div>
          </div>;
        </Link>;
      }
    }
  }</Subscribe>;
};

export default DaoContainer;
