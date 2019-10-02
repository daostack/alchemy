import { DAO, IDAOState,
  IProposalStage,
  Proposal,
} from "@daostack/client";
import classNames from "classnames";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import * as GeoPattern from "geopattern";
import * as moment from "moment";
import * as React from "react";
import { Link } from "react-router-dom";
import { combineLatest } from "rxjs";
import * as css from "./Daos.scss";

interface IExternalProps {
  dao: DAO;
}

type IProps = IExternalProps & ISubscriptionProps<[Proposal[], Proposal[], IDAOState]>

const DaoCard = (props: IProps) => {
  const { dao } = props;
  const [regularProposals, boostedProposals, daoState] = props.data;
  const bgPattern = GeoPattern.generate(dao.id + daoState.name);
  const dxDaoActivationDate = moment("2019-07-14T12:00:00.000+0000");
  const inActive = (daoState.name === "dxDAO") && dxDaoActivationDate.isSameOrAfter(moment());

  return (
    <Link
      className={css.daoLink}
      to={"/dao/" + dao.id}
      key={"dao_" + dao.id}
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

          <table className={css.daoInfoContainer}>
            <tbody>
              <tr>
                <td></td>
                <td><div className={css.daoInfo}>
                  <b>{daoState.memberCount || "0"}</b>
                  <span>Reputation Holders</span>
                </div>
                </td>
                <td><div className={css.daoInfo}>
                  <b>{regularProposals.length + boostedProposals.length}</b>
                  <span>Open Proposals</span>
                </div>
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Link>
  );
};

export default withSubscription({
  wrappedComponent: DaoCard,
  loadingComponent: null,
  errorComponent: (props) => <div>{ props.error.message }</div>,

  checkForUpdate: (oldProps, newProps) => {
    // TODO: does dao.id work here or do we need to load the static state?
    return oldProps.dao.id !== newProps.dao.id;
  },

  createObservable: (props: IExternalProps) => {
    const dao = props.dao;

    return combineLatest(
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
      dao.state() // subscriptions taken care of by parent compnent
    );
  },
});
