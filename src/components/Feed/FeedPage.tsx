import { enableWalletProvider, getArc } from "arc";
import DaosPage from "components/Daos/DaosPage";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import gql from "graphql-tag";
import * as React from "react";
import * as InfiniteScroll from "react-infinite-scroll-component";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { showNotification } from "reducers/notifications";
import { IProfileState, IProfilesState } from "reducers/profilesReducer";
import { combineLatest, of } from "rxjs";

import FeedItem from "./FeedItem";
import * as css from "./Feed.scss";

interface IStateProps {
  currentAccountAddress: string;
  currentAccountProfile: IProfileState;
  profiles: IProfilesState;
}

const mapStateToProps = (state: IRootState): IStateProps => {
  return {
    currentAccountAddress: state.web3.currentAccountAddress,
    currentAccountProfile: state.profiles[state.web3.currentAccountAddress],
    profiles: state.profiles,
  };
};

const mapDispatchToProps = {
  showNotification,
};

interface IDispatchProps {
  showNotification: typeof showNotification;
}

type SubscriptionData = [any[], any[], any[]];

type IProps = IStateProps & IDispatchProps & ISubscriptionProps<SubscriptionData>;

const PAGE_SIZE = 100;

class FeedPage extends React.Component<IProps, null> {

  public handleConnect = async (_event: any): Promise<void> => {
    enableWalletProvider({
      suppressNotifyOnSuccess: true,
      showNotification: this.props.showNotification,
    });
  }

  public renderEmptyFeed() {
    return <div className={css.emptyFeedBanner}>
      <img className={css.birds} src="/assets/images/birds.svg" />
      <h1>Looks like you&apos;re not following anything</h1>
      <h3>Follow DAOs, people and proposals to stay up to date with new proposals and their statuses</h3>
      <div><img src="/assets/images/Icon/down-gray.svg"/></div>
      <DaosPage />
    </div>;
  }

  public render(): RenderOutput {
    const { currentAccountAddress, data, profiles } = this.props;

    if (!currentAccountAddress) {
      return <div className={css.emptyFeedBanner} data-test-id="not-logged-in-banner">
        <img src="/assets/images/unplugged.svg" />
        <h1>Excuse me, who are you?</h1>
        <h3>Please Log In to see your personal feed</h3>
        <button onClick={this.handleConnect} className={css.connectButton}>
          <span>Log In</span>
          <img src="/assets/images/Icon/login-white.svg" />
        </button>
        <div className={css.scrollDown}>Or scroll down to browse all our DAOs</div>
        <div><img src="/assets/images/Icon/down-gray.svg"/></div>
        <DaosPage />
      </div>;
    }

    if (!data) {
      return this.renderEmptyFeed();
    }

    const eventsByDao = data[0] as any[];
    const eventsByProposal = data[1] as any[];
    const eventsByUser = data[2] as any[];
    const events = eventsByDao.concat(eventsByProposal).concat(eventsByUser).sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));

    if (events.length === 0) {
      return this.renderEmptyFeed();
    }

    const { currentAccountProfile } = this.props;

    const eventsHTML = events.map((event: any) =>
      <FeedItem key={event.id} event={event} currentAccountProfile={currentAccountProfile} userProfile={profiles[event.user]} />);

    return (
      <div className={css.feedContainer}>
        <InfiniteScroll
          dataLength={events.length} // This is important field to render the next data
          next={this.props.fetchMore}
          hasMore
          loader=""
          endMessage={
            <p style={{textAlign: "center"}}>
              <b>&mdash;</b>
            </p>
          }
        >
          {eventsHTML}
        </InfiniteScroll>
      </div>
    );
  }
}

const getFeedObservable = (props: IStateProps, existingData?: SubscriptionData) => {
  const arc = getArc();
  const { currentAccountProfile } = props;

  if (!currentAccountProfile) {
    return of(null);
  }

  const queryData = `{
    id
    type
    data
    proposal {
      id
      title
      description
      stakesFor
      stakesAgainst
      votesFor
      votesAgainst
      proposer
      scheme {
        id
        name
      }
      stage
    }
    user
    dao {
      id
      name
    }
    timestamp
  }`;

  let daosString = "";
  let proposalsString = "";
  let usersString = "";
  let daosQuery = of(null);
  let proposalsQuery = of(null);
  let usersQuery = of(null);

  if (currentAccountProfile.follows.proposals && currentAccountProfile.follows.proposals.length > 0) {
    proposalsString = currentAccountProfile.follows.proposals.map((proposal) => "\"" + proposal + "\"").join(",");
    const skip = existingData ? existingData[1].length : 0;
    proposalsQuery = arc.getObservable(gql`query feedProposals
      {
        events(first: ${PAGE_SIZE}, orderBy: timestamp, orderDirection: desc, skip: ${skip}, where: {
          proposal_in: [ ${proposalsString} ]
        }) ${queryData}
      }`);
  }

  if (currentAccountProfile.follows.users && currentAccountProfile.follows.users.length > 0) {
    usersString = currentAccountProfile.follows.users.map((user) => "\"" + user + "\"").join(",");
    const skip = existingData ? existingData[2].length : 0;
    usersQuery = arc.getObservable(gql`query feedUsers
      {
        events(first: ${PAGE_SIZE}, orderBy: timestamp, orderDirection: desc, skip: ${skip}, where: {
          user_in: [ ${usersString} ]
          ${proposalsString ? `, proposal_not_in: [ ${proposalsString} ]` : ""}
        }) ${queryData}
      }
    `);
  }

  if (currentAccountProfile.follows.daos && currentAccountProfile.follows.daos.length > 0) {
    daosString = currentAccountProfile.follows.daos.map((daoAvatarAddress) => "\"" + daoAvatarAddress + "\"").join(",");
    const skip = existingData ? existingData[0].length : 0;
    daosQuery = arc.getObservable(gql`query feedDaos
      {
        events(first: ${PAGE_SIZE}, orderBy: timestamp, orderDirection: desc, skip: ${skip}, where: {
          dao_in: [ ${daosString} ]
          ${usersString ? `, user_not_in: [ ${usersString} ]` : ""}
          ${proposalsString ? `, proposal_not_in: [ ${proposalsString} ]` : ""}
        }) ${queryData}
      }
    `);
  }

  return combineLatest(daosQuery, proposalsQuery, usersQuery, (daoEvents, proposalEvents, userEvents) => {
    return [daoEvents ? daoEvents.data.events : [], proposalEvents ? proposalEvents.data.events : [], userEvents ? userEvents.data.events : []];
  });
};

const SubscribedFeedPage = withSubscription({
  wrappedComponent: FeedPage,
  loadingComponent: <div className={css.loading}><Loading/></div>,
  errorComponent: (props) => <div>{ props.error.message }</div>,

  checkForUpdate: ["currentAccountAddress", "currentAccountProfile"],

  createObservable: getFeedObservable,

  getFetchMoreObservable: getFeedObservable,

  fetchMoreCombine: (prevState: SubscriptionData, newData: SubscriptionData) => {
    return [
      prevState[0].concat(newData[0]),
      prevState[1].concat(newData[1]),
      prevState[2].concat(newData[2]),
    ];
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SubscribedFeedPage);
