import { DAO, IDAOState, Member } from "@dorgtech/arc.js";
import { getArc } from "arc";
import { getProfile } from "actions/profilesActions";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import Analytics from "lib/analytics";
import { Page } from "pages";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import * as InfiniteScroll from "react-infinite-scroll-component";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import * as Sticky from "react-stickynode";
import { combineLatest, from } from "rxjs";
import { IRootState } from "reducers";
import { IProfilesState } from "reducers/profilesReducer";

import DaoMember from "./DaoMember";
import * as css from "./Dao.scss";

interface IExternalProps extends RouteComponentProps<any> {
  daoState: IDAOState;
}

interface IStateProps {
  profiles: IProfilesState;
}

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {
  return {
    ...ownProps,
    profiles: state.profiles,
  };
};

interface IDispatchProps {
  getProfile: typeof getProfile;
}

const mapDispatchToProps = {
  getProfile,
};

type IProps = IExternalProps & IStateProps & ISubscriptionProps<[Member[], IDAOState]> & IDispatchProps;

const PAGE_SIZE = 100;

class DaoMembersPage extends React.Component<IProps, null> {

  public componentDidMount() {
    const [members, daoState] = this.props.data;
    members.forEach((member) => {
      if (!this.props.profiles[member.coreState.address]) {
        this.props.getProfile(member.coreState.address);
      }
    });

    Analytics.track("Page View", {
      "Page Name": Page.DAOMembers,
      "DAO Address": daoState.address,
      "DAO Name": daoState.name,
    });
  }

  public render(): RenderOutput {
    const { data } = this.props;
    const [members, daoState] = data;

    const daoTotalReputation = daoState.reputationTotalSupply;
    const { profiles } = this.props;

    const membersHTML = members.map((member) =>
      <DaoMember key={member.coreState.address} daoState={daoState} daoTotalReputation={daoTotalReputation} member={member} profile={profiles[member.coreState.address]} />);

    return (
      <div className={css.membersContainer}>
        <BreadcrumbsItem to={"/dao/" + daoState.address + "/members"}>DAO Members</BreadcrumbsItem>
        <Sticky enabled top={50} innerZ={10000}>
          <h2>DAO Members</h2>
        </Sticky>
        <table className={css.memberHeaderTable}>
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
          hasMore={members.length < daoState.memberCount}
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
  loadingComponent: <Loading/>,
  errorComponent: (props) => <div>{ props.error.message }</div>,

  checkForUpdate: [], // (oldProps, newProps) => { return oldProps.daoState.address !== newProps.daoState.address; },

  createObservable: async (props: IExternalProps) => {
    const dao = new DAO(getArc(), props.daoState);
    return combineLatest(
      dao.members({
        orderBy: "balance",
        orderDirection: "desc",
        first: PAGE_SIZE,
        skip: 0,
      }),
      from(dao.fetchState())
    );
  },

  // used for hacky pagination tracking
  pageSize: PAGE_SIZE,

  getFetchMoreObservable: (props: IExternalProps, data: [Member[], IDAOState]) => {
    const dao = new DAO(getArc(), props.daoState);
    return combineLatest(
      dao.members({
        orderBy: "balance",
        orderDirection: "desc",
        first: PAGE_SIZE,
        skip: data[0].length,
      }),
      from(dao.fetchState())
    );
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SubscribedDaoMembersPage);
