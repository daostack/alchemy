import { Event, IDAOState, IProposalState } from "@daostack/client";
import { getArc } from "arc";
import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { humanProposalTitle } from "lib/util";
import { IProfileState } from "reducers/profilesReducer";
import * as React from "react";
import { Link } from "react-router-dom";
import { combineLatest } from "rxjs";

import * as css from "./Feed.scss";

type SubscriptionData = [IDAOState, IProposalState];

interface IExternalProps {
  event: Event;
  profile: IProfileState;
}

type IProps = IExternalProps & ISubscriptionProps<SubscriptionData>;

const ProposalFeedItem = (props: IProps) => {
  const { data, event, profile } = props;
  const [ dao, proposal ] = data;

  return (
    <div data-test-id={`eventCardContent-${event.staticState.id}`}>
      <div className={css.daoName}>
        <Link to={`/dao/${dao.address}/scheme/${proposal.scheme}`}>{dao.name} &gt; Scheme Name &gt;</Link>
      </div>

      <div className={css.proposalDetails}>
        <AccountPopup accountAddress={proposal.proposer} daoState={dao} width={17} />
        <AccountProfileName accountAddress={proposal.proposer} accountProfile={profile} daoAvatarAddress={dao.address} />
      </div>

      <Link to={`/dao/${dao.address}/proposal/${proposal.id}`}>
        <h2>Proposal {humanProposalTitle(proposal)}</h2>
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
    const dao = arc.dao(event.staticState.dao);
    const proposal = arc.proposal(event.staticState.proposal);

    return combineLatest(
      dao.state(),
      proposal.state(),
    );
  },
});

export default SubscribedProposalFeedItem;
