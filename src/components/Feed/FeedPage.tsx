import { Event } from "@daostack/client";
import { enableWalletProvider, getAccountIsEnabled, getArc } from "arc";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
//import gql from "graphql-tag";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import * as InfiniteScroll from "react-infinite-scroll-component";
import { connect } from "react-redux";
import * as Sticky from "react-stickynode";
import { IRootState } from "reducers";
import { showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
//import { map } from "rxjs/operators";
import { of } from "rxjs";

import FeedItem from "./FeedItem";
import * as css from "./Feed.scss";

interface IStateProps {
  currentAccountAddress: string;
  currentAccountProfile: IProfileState;
}

const mapStateToProps = (state: IRootState): IStateProps => {
  return {
    currentAccountAddress: state.web3.currentAccountAddress,
    currentAccountProfile: state.profiles[state.web3.currentAccountAddress],
  };
};

const mapDispatchToProps = {
  showNotification,
};

interface IDispatchProps {
  showNotification: typeof showNotification;
}

type IProps = IStateProps & IDispatchProps & ISubscriptionProps<Event[]>;

const PAGE_SIZE = 100;

class FeedPage extends React.Component<IProps, null> {

  public handleConnect = async (_event: any): Promise<void> => {
    enableWalletProvider({
      suppressNotifyOnSuccess: true,
      showNotification: this.props.showNotification,
    });
  }

  public render(): RenderOutput {
    const { data } = this.props;

    if (!getAccountIsEnabled() || !data) {
      return <div onClick={this.handleConnect} className={css.connectButton}>
        <span>Click to connect to your wallet to see your feed </span> <img src="/assets/images/Icon/login.svg"/>
      </div>;
    }

    const events = data;
    const { currentAccountProfile } = this.props;

    const eventsHTML = events.map((event) =>
      <FeedItem key={event.id} event={event} profile={currentAccountProfile} />);

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

    console.log("proposals", props.currentAccountProfile.follows.proposals);
    //const proposalsString = props.currentAccountProfile.follows.proposals.map((proposal) => "\"" + proposal + "\"").join(",");
    // const query = gql`query feedDaos
    //   {
    //     events(where: { proposal_in: [ ${proposalsString} ]}) {
    //       id
    //       type
    //       data
    //       proposal {
    //         title
    //       }
    //       user
    //       dao {
    //         name
    //       }
    //       timestamp
    //     }
    //   }
    // `;

    // console.log(query);
    // const events = arc.getObservable(query, { subscribe: true })
    //   .pipe(map((result: any) => result.data.events));

    const events = Event.search(
      arc,
      {
        where: {
          // eslint-disable-next-line @typescript-eslint/camelcase
          proposal_in: props.currentAccountProfile.follows.proposals,
        },
        orderBy: "timestamp",
        orderDirection: "desc",
        first: PAGE_SIZE,
        skip: 0,
      },
      { fetchAllData: true }, // get and subscribe to all data, so that subcomponents do nto have to send separate queries
    );
    return events;

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
