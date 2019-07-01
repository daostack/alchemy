import { DAO, IDAOState,
  IProposalStage,
  Proposal
  } from "@daostack/client";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import * as GeoPattern from "geopattern";
import * as React from "react";
import { Link } from "react-router-dom";
import { combineLatest } from "rxjs";
import * as css from "./DaoList.scss";

interface IProps {
  dao: DAO;
}

const DaoContainer = (props: IProps) => {
  // const { address } = props;
  const dao = props.dao;
  const observable = combineLatest(
    dao.proposals({ where: {
      stage_in: [IProposalStage.Queued],
      expiresInQueueAt_gt: Math.floor(new Date().getTime() / 1000)
    }}),
    dao.proposals({ where: {
      stage_in: [IProposalStage.Boosted, IProposalStage.PreBoosted, IProposalStage.QuietEndingPeriod]
    }}),
    dao.state()
  );

  return <Subscribe observable={observable}>{(state: IObservableState<[Proposal[], Proposal[], IDAOState]>) => {
      if (state.isLoading) {
        return null;
      } else if (state.error) {
        return <div>{ state.error.message }</div>;
      } else {
        const [regularProposals, boostedProposals, daoState] = state.data;
        const bgPattern = GeoPattern.generate(dao.address + daoState.name);

        return <Link
          className={css.daoLink}
          to={"/dao/" + dao.address}
          key={"dao_" + dao.address}
          data-test-id="dao-link"
        >
          <div className={css.dao}>
            <h3 className={css.daoName} style={{backgroundImage: bgPattern.toDataUrl()}}>{daoState.name}</h3>

            <div className={"clearfix " + css.daoInfoContainer}>
              <div className={css.daoInfoTitle}>
                Statistics
              </div>

              <div className={css.daoInfo}>
                <b>{daoState.memberCount || "?"}</b>
                <span>Reputation Holders</span>
               </div>

              <div className={css.daoInfo}>
                <b>{regularProposals.length + boostedProposals.length}</b>
                <span>Open Proposals</span>
               </div>

              <div className={css.daoInfo}>
                <b>TODO</b>
                <span>GEN Staked</span>
              </div>
              )
            </div>
          </div>
        </Link>;
      }
    }
  }</Subscribe>;
};

export default DaoContainer;
