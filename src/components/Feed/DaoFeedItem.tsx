import { IDAOState } from "@daostack/client";
import { getArc } from "arc";
import { generate } from "geopattern";
import FollowButton from "components/Shared/FollowButton";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import * as React from "react";
import { Link } from "react-router-dom";

import * as css from "./Feed.scss";

type SubscriptionData = IDAOState;

interface IExternalProps {
  event: any;
}

type IProps = IExternalProps & ISubscriptionProps<SubscriptionData>;

const DaoFeedItem = (props: IProps) => {
  const { data, event } = props;
  const dao = data;
  const bgPattern = generate(dao.address + dao.name);

  return (
    <div data-test-id={`eventCardContent-${event.id}`} className={css.daoItem}>
      <b className={css.daoIcon} style={{ backgroundImage: bgPattern.toDataUrl() }}></b>
      <Link to={"/dao/" + dao.address} className={css.daoName}>
        <span>{dao.name}</span>
      </Link>
      <div className={css.followButton}><FollowButton id={event.dao.id} type="daos" /></div>
      <br/>
      <span>{dao.memberCount} DAO Members</span>
    </div>
  );
};

const SubscribedDaoFeedItem = withSubscription({
  wrappedComponent: DaoFeedItem,
  loadingComponent: <Loading/>,
  errorComponent: (props) => <div>{ props.error.message }</div>,

  checkForUpdate: ["event"],

  createObservable: (props: IExternalProps) => {
    const arc = getArc();
    const { event } = props;
    const dao = arc.dao(event.dao.id);
    return dao.state();
  },
});

export default SubscribedDaoFeedItem;
