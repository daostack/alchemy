import { DAO, IDAOState } from "@daostack/arc.js";
import classNames from "classnames";
import FollowButton from "components/Shared/FollowButton";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { generate } from "geopattern";
import { getNetworkByDAOAddress } from "lib/util";
import * as moment from "moment";
import * as React from "react";
import { Link } from "react-router-dom";
import * as css from "./Daos.scss";

interface IExternalProps {
  dao: DAO;
}

type IProps = IExternalProps & ISubscriptionProps<IDAOState>


const DaoCard = (props: IProps) => {
  const { dao } = props;
  const daoState = props.data;
  const bgPattern = generate(dao.id + daoState.name);
  const dxDaoActivationDate = moment("2019-07-14T12:00:00.000+0000");
  const inActive = (daoState.name === "dxDAO") && dxDaoActivationDate.isSameOrAfter(moment());
  const handleClick = (e: any) => { if (inActive) { e.preventDefault(); } };

  return (
    <Link
      className={css.daoLink}
      to={"/dao/" + dao.id}
      key={"dao_" + dao.id}
      data-test-id="dao-link"
      onClick={handleClick}
    >
      <div className={classNames({
        [css.dao]: true,
        [css.daoInactive]: inActive})}>
        <div className={css.daoTitle}
          style={{backgroundColor: bgPattern.color}}>
          <div className={css.daoName}>{daoState.name}</div>
          <FollowButton id={dao.id} type="daos" style="white" network={getNetworkByDAOAddress(daoState.address)} />
          {inActive ? <div className={css.inactiveFeedback} ><div className={css.time}>{ dxDaoActivationDate.format("MMM Do")}&nbsp;
            {dxDaoActivationDate.format("h:mma z")}</div><img src="/assets/images/Icon/alarm.svg"></img></div> : ""}
        </div>

        <div className={"clearfix " + css.daoInfoContainer}>
          <table className={css.daoInfoContainer}>
            <tbody>
              <tr>
                <td></td>
                <td><div className={css.daoInfo}>
                  <b>{daoState.memberCount || "0"}</b>
                  <span>DAO Members</span>
                </div>
                </td>
                <td><div className={css.daoInfo}>
                  <b>{daoState.numberOfQueuedProposals+ daoState.numberOfBoostedProposals + daoState.numberOfPreBoostedProposals}</b>
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
    return oldProps.dao.id !== newProps.dao.id;
  },

  createObservable: (props: IExternalProps) => {
    const dao = props.dao;
    return dao.state();
  },
});
