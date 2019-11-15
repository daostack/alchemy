import { IDAOState, Member, Reputation, IReputationState } from "@daostack/client";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import * as InfiniteScroll from "react-infinite-scroll-component";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import * as Sticky from "react-stickynode";
import { IRootState } from "reducers";
import { IProfilesState } from "reducers/profilesReducer";

import { mergeMap, map } from "rxjs/operators";
import { combineLatest } from "rxjs";
import DaoMember from "./DaoMember";
import * as css from "./Dao.scss";

import BN = require("bn.js");

interface IExternalProps extends RouteComponentProps<any> {
  daoState: IDAOState;
}

interface IStateProps {
  profiles: IProfilesState;
}

type IProps = IExternalProps & IStateProps & ISubscriptionProps<[Member[], BN]>;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {
  return {
    ...ownProps,
    profiles: state.profiles,
  };
};

const PAGE_SIZE = 100;

class DaoMembersPage extends React.Component<IProps, null> {

  public render(): RenderOutput {
    const { data } = this.props;

    const members = data[0];
    const daoTotalReputation = data[1];
    const { daoState, profiles } = this.props;

    const membersHTML = members.map((member) =>
      <DaoMember key={member.staticState.address} dao={daoState} daoTotalReputation={daoTotalReputation} member={member} profile={profiles[member.staticState.address]} />);

    return (
      <div className={css.membersContainer}>
        <BreadcrumbsItem to={"/dao/" + daoState.address + "/members"}>Reputation Holders</BreadcrumbsItem>
        <Sticky enabled top={50} innerZ={10000}>
          <h2>Reputation Holders</h2>
        </Sticky>
        <table>
          <tbody className={css.memberTable + " " + css.memberTableHeading}>
            <tr>
              <td className={css.memberAvatar}></td>
              <td className={css.memberName}>Name</td>
              <td className={css.memberAddress}>Address</td>
              <td className={css.memberReputation}>Reputation</td>
              <td className={css.memberSocial}>Social Verification</td>
            </tr>
          </tbody>
        </table>
        <InfiniteScroll
          dataLength={members.length} //This is important field to render the next data
          next={this.props.fetchMore}
          hasMore={members.length < this.props.daoState.memberCount}
          loader={<h4>Loading...</h4>}
          endMessage={
            <p style={{textAlign: "center"}}>
              <b>&mdash;</b>
            </p>
          }
        >
          {membersHTML}
        </InfiniteScroll>
      </div>
    );
  }
}

const SubscribedDaoMembersPage = withSubscription({
  wrappedComponent: DaoMembersPage,
  loadingComponent: <div className={css.loading}><Loading/></div>,
  errorComponent: (props) => <div>{ props.error.message }</div>,

  checkForUpdate: [], // (oldProps, newProps) => { return oldProps.daoState.address !== newProps.daoState.address; },

  createObservable: async (props: IExternalProps) => {
    const dao = props.daoState.dao;

    return combineLatest(
      dao.members({
        orderBy: "balance",
        orderDirection: "desc",
        first: PAGE_SIZE,
        skip: 0,
      }),
      dao.nativeReputation().pipe(
        mergeMap((reputation: Reputation) => reputation.state({subscribe: true})),
        map((reputationState: IReputationState) => reputationState.totalSupply)
      )
    );
  },

  // used for hacky pagination tracking
  pageSize: PAGE_SIZE,

  getFetchMoreObservable: (props: IExternalProps, data: [Member[], BN]) => {
    const dao = props.daoState.dao;
    return combineLatest(
      dao.members({
        orderBy: "balance",
        orderDirection: "desc",
        first: PAGE_SIZE,
        skip: data.length,
      }),
      dao.nativeReputation().pipe(
        mergeMap((reputation: Reputation) => reputation.state({subscribe: true})),
        map((reputationState: IReputationState) => reputationState.totalSupply)
      )
    );
  },
});

export default connect(mapStateToProps)(SubscribedDaoMembersPage);
