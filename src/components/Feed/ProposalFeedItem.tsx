// import { IDAOState, IProposalState } from "@daostack/client";
import { IDAOState } from "@daostack/client";
import { getArc } from "arc";
import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { humanProposalTitle } from "lib/util";
import { IProfileState } from "reducers/profilesReducer";
import * as React from "react";
import { Link } from "react-router-dom";
// import { combineLatest } from "rxjs";

import * as css from "./Feed.scss";

// type SubscriptionData = [IDAOState, IProposalState];
type SubscriptionData = IDAOState;

interface IExternalProps {
  event: any;
  profile: IProfileState;
}

type IProps = IExternalProps & ISubscriptionProps<SubscriptionData>;

const ProposalFeedItem = (props: IProps) => {
  const { data, event, profile } = props;
  // const [ dao, proposal ] = data;
  const dao = data;

  return (
    <div data-test-id={`eventCardContent-${event.id}`}>
      <div className={css.daoName}>
        <Link to={`/dao/${dao.address}/scheme/${event.proposal.scheme.id}`}>{dao.name} &gt; {event.proposal.scheme.name} &gt;</Link>
      </div>

      <div className={css.proposalDetails}>
        <AccountPopup accountAddress={event.proposal.proposer} daoState={dao} width={17} />
        <AccountProfileName accountAddress={event.proposal.proposer} accountProfile={profile} daoAvatarAddress={dao.address} />
      </div>

      <Link to={`/dao/${dao.address}/proposal/${event.proposal.id}`}>
        <h2>Proposal {humanProposalTitle(event.proposal)}</h2>
        <div>{JSON.stringify(event.data)}</div>
      </Link>
    </div>
  );
};

const SubscribedProposalFeedItem = withSubscription({
  wrappedComponent: ProposalFeedItem,
  loadingComponent: <div className={css.loading}><Loading/></div>,
  errorComponent: (props) => <div>{ props.error.message }</div>,

  checkForUpdate: ["event", "profile"],

  createObservable: (props: IExternalProps) => {
    const arc = getArc();
    const { event } = props;
    const dao = arc.dao(event.dao.id);
    // const proposal = arc.proposal(event.proposal);

    return dao.state();
    // return combineLatest(
    //   dao.state(),
    //   proposal.state(),
    // );
  },
});

export default SubscribedProposalFeedItem;
