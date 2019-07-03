import { DAO, IDAOState, IMemberState, Member } from "@daostack/client";
import { getArc } from "arc";
import AccountImage from "components/Account/AccountImage";
import AccountProfileName from "components/Account/AccountProfileName";
import OAuthLogin from "components/Account/OAuthLogin";
import ReputationView from "components/Account/ReputationView";
import Loading from "components/Shared/Loading";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import Util from "lib/util";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { IRootState } from "reducers";
import { IProfilesState } from "reducers/profilesReducer";
import * as css from "./ViewDao.scss";

interface IProps extends RouteComponentProps<any> {
  dao: IDAOState;
  members: Member[];
  profiles: IProfilesState;
  fetchMore: () => void;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    dao: ownProps.dao,
    members: ownProps.members,
    profiles: state.profiles
  };
};

class DaoMembersContainer extends React.Component<IProps, null> {

  public render() {
    const { dao, members, profiles } = this.props;

    const membersHTML = members.map((member) => {
      return <Subscribe observable={member.state()} key={member.address}>{(state: IObservableState<IMemberState>) => {
        if (state.error) {
          return <div>{state.error.message}</div>;
        } else if (state.data) {
          const memberState = state.data;
          const profile = profiles[memberState.address];
          return (
            <div className={css.member + " clearfix"}
              key={"member_" + memberState.address}
              data-test-id={"member_" + memberState.address}>
              <AccountImage
                accountAddress={memberState.address}
                className="membersPage"
              />
              <div className={css.memberAddress}>
                { profile ?
                  <div>
                    <AccountProfileName accountAddress={memberState.address} accountProfile={profile} daoAvatarAddress={dao.address} />
                    {Object.keys(profile.socialURLs).length === 0 ? "" :
                      <span>
                        <OAuthLogin editing={false} provider="facebook" accountAddress={memberState.address} profile={profile} className={css.socialButton}/>
                        <OAuthLogin editing={false} provider="twitter" accountAddress={memberState.address} profile={profile} className={css.socialButton} />
                        <OAuthLogin editing={false} provider="github" accountAddress={memberState.address} profile={profile} className={css.socialButton} />
                      </span>
                    }
                    <br/>
                  </div>
                  : <div className={css.noProfile}>No Profile</div>
                }
                <div className={css.address}>{memberState.address}</div>
              </div>
              <span className={css.reputationAmount}>{Util.fromWei(memberState.reputation).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}</span>
              <div className={css.reputationAmounts}>
                <ReputationView daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={memberState.reputation}/>
              </div>
            </div>
          );
        } else {
          return <div>...loading..</div>;
        }
      }}</Subscribe>;
    });

    return (
      <div className={css.membersContainer}>
        <BreadcrumbsItem to={"/dao/" + dao.address + "/members"}>Reputation Holders</BreadcrumbsItem>
        <h2>Reputation Holders</h2>
        {membersHTML}
        <button onClick={ () => this.props.fetchMore()}>LOAD MORE....</button>
      </div>
    );
  }

}

const ConnectedDaoMembersContainer = connect(mapStateToProps)(DaoMembersContainer);

export default (props: { dao: IDAOState } & RouteComponentProps<any>) => {
  const arc = getArc();

  const dao = new DAO(props.dao.address, arc);
  const PAGE_SIZE = 10;
  const observable = dao.members({
    orderBy: "balance",
    orderDirection: "desc",
    first: PAGE_SIZE,
    skip: 0
  });
  return <Subscribe observable={observable}>{(state: IObservableState<Member[]>) => {
      if (state.isLoading) {
        return (<div className={css.loading}><Loading/></div>);
      } else if (state.error) {
        return <div>{ state.error.message }</div>;
      } else {
        return <ConnectedDaoMembersContainer
          members={state.data}
          dao={props.dao}
          fetchMore={ () => {
            state.fetchMore({
              observable: dao.members({
                orderBy: "balance",
                orderDirection: "desc",
                first: PAGE_SIZE,
                skip: state.data.length
              })
            });
          }}
      />;
      }
    }
  }</Subscribe>;
};
