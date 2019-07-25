import { DAO, IDAOState,
  IProposalStage,
  Proposal,
} from "@daostack/client";
import classNames from "classnames";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import * as GeoPattern from "geopattern";
import * as moment from "moment";
import * as React from "react";
import { Link } from "react-router-dom";
import { combineLatest } from "rxjs";
import * as css from "./Daos.scss";

interface IProps {
  dao: DAO;
}

const DaoCard = (props: IProps) => {
  // const { address } = props;
  const dao = props.dao;
  const observable = combineLatest(
    dao.proposals({ where: {
      // eslint-disable-next-line @typescript-eslint/camelcase
      stage_in: [IProposalStage.Queued],
      // eslint-disable-next-line @typescript-eslint/camelcase
      expiresInQueueAt_gt: Math.floor(new Date().getTime() / 1000),
    }}),
    dao.proposals({ where: {
      // eslint-disable-next-line @typescript-eslint/camelcase
      stage_in: [IProposalStage.Boosted, IProposalStage.PreBoosted, IProposalStage.QuietEndingPeriod],
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
      const dxDaoActivationDate = moment("2019-07-14T12:00:00.000+0000");
      const inActive = (daoState.name === "dxDAO") && dxDaoActivationDate.isSameOrAfter(moment());

      return <Link
        className={css.daoLink}
        to={"/dao/" + dao.address}
        key={"dao_" + dao.address}
        data-test-id="dao-link"
        onClick={(e) => { if (inActive) { e.preventDefault(); } }}
      >
        <div className={classNames({
          [css.dao]: true,
          [css.daoInactive]: inActive})}>
          <div className={css.daoTitle}
            style={{backgroundImage: bgPattern.toDataUrl()}}>

            <div className={css.daoName}>{daoState.name}</div>

            {inActive ? <div className={css.inactiveFeedback} ><div className={css.time}>{ dxDaoActivationDate.format("MMM Do")}&nbsp;
              {dxDaoActivationDate.format("h:mma z")}</div><img src="/assets/images/Icon/alarm.svg"></img></div> : ""}
          </div>

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

              )
          </div>
        </div>
      </Link>;
    }
  }
  }</Subscribe>;
};

export default DaoCard;
