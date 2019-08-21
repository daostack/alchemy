import { DAO, IDAOState, Member } from "@daostack/client";
import { getArc } from "arc";
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

import DaoMember from "./DaoMember";
import * as css from "./Dao.scss";

interface IExternalProps extends RouteComponentProps<any> {
  dao: IDAOState;
}

interface IStateProps {
  profiles: IProfilesState;
}

type IProps = IExternalProps & IStateProps & ISubscriptionProps<Member[]>;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {
  return {
    ...ownProps,
    profiles: state.profiles,
  };
};

const PAGE_SIZE = 100;

class DaoMembersPage extends React.Component<IProps, null> {

  public render() {
    const { data } = this.props;

    const members = data;
    const { dao, profiles } = this.props;

    // TODO: member static state address? or need to pass in all profiles and wait for state?
    const membersHTML = members.map((member) => <DaoMember key={member.id} dao={dao} member={member} profile={profiles[member.id]} />);

    return (
      <div className={css.membersContainer}>
        <BreadcrumbsItem to={"/dao/" + dao.address + "/members"}>Reputation Holders</BreadcrumbsItem>
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
          hasMore={members.length < this.props.dao.memberCount}
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

  checkForUpdate: (oldProps, newProps) => { return oldProps.dao.address !== newProps.dao.address; },

  createObservable: (props: IExternalProps) => {
    const arc = getArc();

    const dao = new DAO(props.dao.address, arc);

    return dao.members({
      orderBy: "balance",
      orderDirection: "desc",
      first: PAGE_SIZE,
      skip: 0,
    });
  },

  // used for hacky pagination tracking
  pageSize: PAGE_SIZE,

  getFetchMoreObservable: (props: IExternalProps, data: Member[]) => {
    const arc = getArc();
    const dao = new DAO(props.dao.address, arc);
    return dao.members({
      orderBy: "balance",
      orderDirection: "desc",
      first: PAGE_SIZE,
      skip: data.length,
    });
  },
});

export default connect(mapStateToProps)(SubscribedDaoMembersPage);
