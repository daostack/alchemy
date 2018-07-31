import * as classNames from "classnames";
import { denormalize } from "normalizr";
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link, RouteComponentProps } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IAccountState, IDaoState } from "reducers/arcReducer";
import * as schemas from "schemas";

import AccountImage from "components/Account/AccountImage";

import * as css from "./ViewDao.scss";

interface IStateProps extends RouteComponentProps<any> {
  dao: IDaoState;
}

// TODO: can i make this not a container and just take the dao passed in as a prop?
const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    dao: denormalize(state.arc.daos[ownProps.match.params.daoAvatarAddress], schemas.daoSchema, state.arc),
  };
};

interface IDispatchProps {}

const mapDispatchToProps = {};

type IProps = IStateProps & IDispatchProps;

class DaoMembersContainer extends React.Component<IProps, null> {

  public render() {
    const { dao } = this.props;

    const membersHTML = dao.members.map((member: IAccountState) => {
      return (
        <div className={css.member + " " + css.clearfix} key={"member_" + member.address}>
          <AccountImage
            accountAddress={member.address}
            className="membersPage"
          />
          <div className={css.memberAddress}>
            {member.address}
          </div>

          <div className={css.memberHoldings}>
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
