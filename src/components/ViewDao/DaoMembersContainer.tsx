import * as classNames from 'classnames';
import { denormalize } from 'normalizr';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Link, RouteComponentProps } from 'react-router-dom'

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IDaoState, IMemberState } from 'reducers/arcReducer';
import * as schemas from '../../schemas';

import AccountPopup from 'components/Account/AccountImage';

import * as css from './ViewDao.scss';

interface IStateProps extends RouteComponentProps<any> {
  dao: IDaoState,
}

// TODO: can i make this not a container and just take the dao passed in as a prop?
const mapStateToProps = (state : IRootState, ownProps: any) => {
  return {
    dao: denormalize(state.arc.daos[ownProps.match.params.daoAddress], schemas.daoSchema, state.arc),
  };
};

interface IDispatchProps {}

const mapDispatchToProps = {};

type IProps = IStateProps & IDispatchProps

class DaoMembersContainer extends React.Component<IProps, null> {

  render() {
    const { dao } = this.props;

    const membersHTML = Object.keys(dao.members).map((address : string) => {
      const member = dao.members[address];
      return (
        <div className={css.member + " " + css.clearfix} key={"member_" + address}>
          <AccountPopup
            accountAddress={member.address}
            className="membersPage"
          />
          <div className={css.memberAddress}>
            {member.address}
          </div>
          
          <div className={css.memberHoldings}>
            Tokens: <span>{member.tokens}</span>
            <div className={css.verticalDivider}></div>
            Reputation: <span>{member.reputation}</span>
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