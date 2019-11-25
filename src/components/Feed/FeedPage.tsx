//import { Event } from "@daostack/client";
import { enableWalletProvider, getAccountIsEnabled, getArc } from "arc";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import gql from "graphql-tag";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import * as InfiniteScroll from "react-infinite-scroll-component";
import { connect } from "react-redux";
import * as Sticky from "react-stickynode";
import { IRootState } from "reducers";
import { showNotification } from "reducers/notifications";
import { IProfileState, IProfilesState } from "reducers/profilesReducer";
// import { map } from "rxjs/operators";
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

type IProps = IStateProps & IDispatchProps & ISubscriptionProps<[any, any]>;

const PAGE_SIZE = 100;

class FeedPage extends React.Component<IProps, null> {

  public handleConnect = async (_event: any): Promise<void> => {
    enableWalletProvider({
      suppressNotifyOnSuccess: true,
      showNotification: this.props.showNotification,
    });
  }

  public render(): RenderOutput {
    const { data, profiles } = this.props;

    if (!getAccountIsEnabled() || !data) {
      return <div onClick={this.handleConnect} className={css.connectButton}>
        <span>Click to connect to your wallet to see your feed </span> <img src="/assets/images/Icon/login.svg"/>
      </div>;
    }

    const eventsByProposal = data[0].data.events as any[];
    const eventsByDao = data[1].data.events as any[];
    const events = eventsByProposal.concat(eventsByDao).sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
    const { currentAccountProfile } = this.props;

    const eventsHTML = events.map((event: any) =>
      <FeedItem key={event.id} event={event} currentAccountProfile={currentAccountProfile} userProfile={profiles[event.user]} />);

    return (
      <div className={css.feedContainer}>
        <BreadcrumbsItem to={"/feed"}>Personal Feed</BreadcrumbsItem>
        <Sticky enabled top={50} innerZ={10000}>
          <h2>Personal Feed</h2>
        </Sticky>

        <InfiniteScroll
          dataLength={events.length} //This is important field to render the next data
          next={this.props.fetchMore}
          hasMore
          loader={<h4>Loading...</h4>}
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

const SubscribedFeedPage = withSubscription({
  wrappedComponent: FeedPage,
  loadingComponent: <div className={css.loading}><Loading/></div>,
  errorComponent: (props) => <div>{ props.error.message }</div>,

  checkForUpdate: ["currentAccountAddress", "currentAccountProfile"],

  createObservable: (props: IStateProps) => {
    const arc = getArc();

    if (!props.currentAccountProfile) {
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

    const proposalsString = props.currentAccountProfile.follows.proposals.map((proposal) => "\"" + proposal + "\"").join(",");
    const proposalsQuery = gql`query feedProposals
      {
        events(first: ${PAGE_SIZE}, where: { proposal_in: [ ${proposalsString} ]}) ${queryData}
      }`;
    const daosString = props.currentAccountProfile.follows.daos.map((daoAvatarAddress) => "\"" + daoAvatarAddress + "\"").join(",");
    const daosQuery = gql`query feedDaos
      {
        events(first: ${PAGE_SIZE}, where: { dao_in: [ ${daosString} ]}) ${queryData}
      }
    `;

    // console.log(query);
    // const events = arc.getObservable(query, { subscribe: true })
    //   .pipe(map((result: any) => result.data.events));

    return combineLatest(
      arc.getObservable(proposalsQuery),
      arc.getObservable(daosQuery)
    );
    return ;
    // const events = Event.search(
    //   arc,
    //   {
    //     where: {
    //       // eslint-disable-next-line @typescript-eslint/camelcase
    //       proposal_in: props.currentAccountProfile.follows.proposals,
    //     },
    //     orderBy: "timestamp",
    //     orderDirection: "desc",
    //     first: PAGE_SIZE,
    //     skip: 0,
    //   },
    //   { fetchAllData: true }, // get and subscribe to all data, so that subcomponents do nto have to send separate queries
    // );
    // return events;

    // return combineLatest(
    //   dao.state({ fetchAllData: true }), // DAO state
    //   arc.dao(daoAvatarAddress).schemes({}, { fetchAllData: true, subscribe: true })
    // );
  },

  // getFetchMoreObservable: (props: IStateProps, data: Member[]) => {
  //   const dao = props.daoState.dao;
  //   return dao.members({
  //     orderBy: "balance",
  //     orderDirection: "desc",
  //     first: PAGE_SIZE,
  //     skip: data.length,
  //   });
  // },
});

export default connect(mapStateToProps, mapDispatchToProps)(SubscribedFeedPage);
