import { IDAOState, IMemberState } from "@dorgtech/client";
import { getArc } from "arc";
import AccountPopup from "components/Account/AccountPopup";
import AccountProfileName from "components/Account/AccountProfileName";
import FollowButton from "components/Shared/FollowButton";
import Loading from "components/Shared/Loading";
import Reputation from "components/Account/Reputation";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { IProfileState } from "reducers/profilesReducer";
import * as React from "react";
import { combineLatest } from "rxjs";

import * as css from "./Feed.scss";

interface IStateProps {
  profile: IProfileState;
}

interface IExternalProps {
  event: any;
}

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {
  return {
    ...ownProps,
    profile: state.profiles[ownProps.event.user],
  };
};

type SubscriptionData = [IDAOState, IMemberState];

type IProps = IStateProps & IExternalProps & ISubscriptionProps<SubscriptionData>;

const UserFeedItem = (props: IProps) => {
  const { data, event, profile } = props;
  const [dao, member] = data;

  return (
    <div data-test-id={`eventCardContent-${event.id}`} className={css.userItem}>
      <div className={css.userName}>
        <AccountPopup accountAddress={event.user} daoState={dao} width={17} />
        <AccountProfileName accountAddress={event.user} accountProfile={profile} daoAvatarAddress={dao.address} />
        &nbsp;<span>with</span>&nbsp;
        <span className={css.reputation}><Reputation daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={member.reputation} /></span>
      </div>

      <div className={css.followButton}><FollowButton id={event.user} type="users" /></div>

      <div className={css.bio}>
        Bio: {profile ? profile.description : "N/A"}
      </div>
    </div>
  );
};

const SubscribedUserFeedItem = withSubscription({
  wrappedComponent: UserFeedItem,
  loadingComponent: <Loading/>,
  errorComponent: (props) => <div>{ props.error.message }</div>,

  checkForUpdate: ["event"],

  createObservable: (props: IExternalProps) => {
    const arc = getArc();
    const { event } = props;
    const dao = arc.dao(event.dao.id);

    return combineLatest(
      dao.state(),
      dao.member(event.user).state(),
    );
  },
});

export default connect(mapStateToProps)(SubscribedUserFeedItem);
