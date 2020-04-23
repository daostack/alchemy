import { IDAOState } from "@daostack/client-experimental";
import { getArc } from "arc";
import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import FollowButton from "components/Shared/FollowButton";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { humanProposalTitle } from "lib/util";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { IProfileState } from "reducers/profilesReducer";
import * as React from "react";
import { Link } from "react-router-dom";

import * as css from "./Feed.scss";

const ReactMarkdown = require("react-markdown");


// type SubscriptionData = [IDAOState, IProposalState];
type SubscriptionData = IDAOState;

interface IStateProps {
  proposerProfile: IProfileState;
}

interface IExternalProps {
  event: any;
}

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {
  return {
    ...ownProps,
    proposerProfile: state.profiles[ownProps.event.proposal.proposer],
  };
};

type IProps = IStateProps & IExternalProps & ISubscriptionProps<SubscriptionData>;

const ProposalFeedItem = (props: IProps) => {
  const { data, event, proposerProfile } = props;
  const dao = data;

  return (
    <div data-test-id={`eventCardContent-${event.id}`} className={css.proposalItem}>
      <div className={css.daoName}>
        <Link to={`/dao/${dao.address}/scheme/${event.proposal.scheme.id}`}>{dao.name} &gt; {event.proposal.scheme.name} &gt;</Link>
      </div>

      <div className={css.proposalDetails}>
        <AccountPopup accountAddress={event.proposal.proposer} daoState={dao} width={17} />
        <AccountProfileName accountAddress={event.proposal.proposer} accountProfile={proposerProfile} daoAvatarAddress={dao.address} />
      </div>

      <Link to={`/dao/${dao.address}/proposal/${event.proposal.id}`}>
        <h3>{humanProposalTitle(event.proposal)}</h3>
      </Link>

      <div className={css.followButton}><FollowButton id={event.proposal.id} type="proposals" /></div>

      <div className={css.proposalDescription}>
        { event.proposal.description ?
          <ReactMarkdown source={event.proposal.description}
            renderers={{link: (props: { href: string; children: React.ReactNode }) => {
              return <a href={props.href} target="_blank" rel="noopener noreferrer">{props.children}</a>;
            }}}
          />
          : "" }
      </div>

      <Link to={`/dao/${dao.address}/proposal/${event.proposal.id}`}>Show full proposal details &gt;</Link>

    </div>
  );
};

const SubscribedProposalFeedItem = withSubscription({
  wrappedComponent: ProposalFeedItem,
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

export default connect(mapStateToProps)(SubscribedProposalFeedItem);

