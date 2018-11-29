import * as classNames from "classnames";
import { denormalize } from "normalizr";
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link, RouteComponentProps } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IAccountState, IDaoState } from "reducers/arcReducer";
import { IProfilesState, IProfileState } from "reducers/profilesReducer";
import * as schemas from "schemas";

import AccountImage from "components/Account/AccountImage";
import AccountProfileName from "components/Account/AccountProfileName";

import * as css from "./ViewDao.scss";

interface IStateProps extends RouteComponentProps<any> {
  dao: IDaoState;
  profiles: IProfilesState;
}

// TODO: can i make this not a container and just take the dao passed in as a prop?
const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    dao: denormalize(state.arc.daos[ownProps.match.params.daoAvatarAddress], schemas.daoSchema, state.arc),
    profiles: state.profiles
  };
};

interface IDispatchProps {}

const mapDispatchToProps = {};

type IProps = IStateProps & IDispatchProps;

class DaoMembersContainer extends React.Component<IProps, null> {

  public render() {
    const { dao, profiles } = this.props;

    const membersHTML = dao.members.map((member: IAccountState) => {
      const profile = profiles[member.address];
      return (
        <div className={css.member + " " + css.clearfix} key={"member_" + member.address}>
          <AccountImage
            accountAddress={member.address}
            className="membersPage"
          />
          <div className={css.memberAddress}>
            <AccountProfileName accountProfile={profile} daoAvatarAddress={dao.avatarAddress} />{profile ? <br/> : "" }
            <div>{member.address}</div>
          </div>
          <div>
            Reputation: <span>{member.reputation.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} ({(100 * member.reputation / dao.reputationCount).toFixed(1)}%)</span>
          </div>
        </div>
      );
    });

    return (
      <div className={css.membersContainer}>
        {membersHTML}
      </div>
    );
  }

}

export default connect(mapStateToProps, mapDispatchToProps)(DaoMembersContainer);
