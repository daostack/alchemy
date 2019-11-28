//import { Event } from "@daostack/client";
import { enableWalletProvider, getAccountIsEnabled, getArc } from "arc";
import DaosPage from "components/Daos/DaosPage";
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

type IProps = IStateProps & IDispatchProps & ISubscriptionProps<[any, any, any]>;

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
      return <div className={css.unconnectedBanner}>
        <img src="/assets/images/unplugged.svg" />
        <h1>Excuse me, who are you?</h1>
        <h3>Please connect to see your personal feed</h3>
        <button onClick={this.handleConnect} className={css.connectButton}>
          <span>Connect</span>
          <img src="/assets/images/Icon/login-white.svg" />
        </button>
        <div className={css.scrollDown}>Or scroll down to browse all our DAOs</div>
        <div><img src="/assets/images/Icon/down-gray.svg"/></div>
        <DaosPage />
      </div>;
    }

    const eventsByDao = data[0].data.events as any[];
    const eventsByProposal = data[1].data.events as any[];
    //const eventsByScheme = data[2].data.events as any[];
    const eventsByUser = data[2].data.events as any[];
    const events = eventsByDao.concat(eventsByProposal).concat(eventsByUser).sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
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
    let daosQuery = of([]);
    let proposalsQuery = of([]);
    //let schemesQuery = of([]);
    let usersQuery = of([]);

    if (currentAccountProfile.follows.daos) {
      daosString = currentAccountProfile.follows.daos.map((daoAvatarAddress) => "\"" + daoAvatarAddress + "\"").join(",");
      daosQuery = arc.getObservable(gql`query feedDaos
        {
          events(first: ${PAGE_SIZE}, where: { dao_in: [ ${daosString} ]}) ${queryData}
        }
      `);
    }

    if (currentAccountProfile.follows.proposals) {
      proposalsString = currentAccountProfile.follows.proposals.map((proposal) => "\"" + proposal + "\"").join(",");
      proposalsQuery = arc.getObservable(gql`query feedProposals
        {
          events(first: ${PAGE_SIZE}, where: {
            proposal_in: [ ${proposalsString} ]
            ${daosString ? `, dao_not_in: [ ${daosString} ]` : ""}
          }) ${queryData}
        }`);
    }

    // if (currentAccountProfile.follows.schemes) {
    //   const schemesString = currentAccountProfile.follows.schemes.map((scheme) => "\"" + scheme + "\"").join(",");
    //   schemesQuery = arc.getObservable(gql`query feedSchemes
    //     {
    //       events(first: ${PAGE_SIZE}, where: { scheme_in: [ ${schemesString} ]}) ${queryData}
    //     }
    //   `);
    // }

    if (currentAccountProfile.follows.users) {
      usersString = currentAccountProfile.follows.users.map((user) => "\"" + user + "\"").join(",");
      usersQuery = arc.getObservable(gql`query feedUsers
        {
          events(first: ${PAGE_SIZE}, where: {
            user_in: [ ${usersString} ]
            ${daosString ? `, dao_not_in: [ ${daosString} ]` : ""}
            ${proposalsString ? `, proposal_not_in: [ ${proposalsString} ]` : ""}
          }) ${queryData}
        }
      `);
    }

    return combineLatest(daosQuery, proposalsQuery, usersQuery);
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
