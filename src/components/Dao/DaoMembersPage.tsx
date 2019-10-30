import { IDAOState, Member } from "@daostack/client";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import * as InfiniteScroll from "react-infinite-scroll-component";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import * as Sticky from "react-stickynode";
import { IRootState } from "reducers";

import DaoMember from "./DaoMember";
import * as css from "./Dao.scss";

interface IExternalProps extends RouteComponentProps<any> {
  daoState: IDAOState;
}

type IProps = IExternalProps & ISubscriptionProps<Member[]>;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps => {
  return {
    ...ownProps
  };
};

const PAGE_SIZE = 100;

class DaoMembersPage extends React.Component<IProps, null> {

  public render(): RenderOutput {
    const { data } = this.props;

    const members = data;
    const daoTotalReputation = this.props.daoState.reputationTotalSupply;
    const { daoState } = this.props;

    const membersHTML = members.map((member) =>
      <DaoMember key={member.staticState.address} dao={daoState} daoTotalReputation={daoTotalReputation} member={member} />);

    return (
      <div className={css.membersContainer}>
        <BreadcrumbsItem to={"/dao/" + daoState.address + "/members"}>Reputation Holders</BreadcrumbsItem>
        <Sticky enabled top={50} innerZ={10000}>
          <h2>Reputation Holders</h2>
        </Sticky>
        <table className={css.memberHeaderTable}>
          <tbody className={css.memberTable + " " + css.memberTableHeading}>
            <tr>
              <td className={css.memberName}>Name</td>
              <td className={css.memberAddress}>Address</td>
              <td className={css.memberReputation}>Reputation</td>
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
    const dao = props.daoState.dao;
    return dao.members({
      orderBy: "balance",
      orderDirection: "desc",
      first: PAGE_SIZE,
      skip: data.length,
    });
  },
});

export default connect(mapStateToProps)(SubscribedDaoMembersPage);
