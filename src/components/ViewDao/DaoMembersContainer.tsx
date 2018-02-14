import * as classNames from 'classnames';
import { denormalize } from 'normalizr';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Link, RouteComponentProps } from 'react-router-dom'

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IDaoState, ICollaboratorState } from 'reducers/arcReducer';
import * as schemas from '../../schemas';

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
    console.log("mojo", dao.members);
    const membersHTML = dao.members.map((member : ICollaboratorState, index : number) => {
      return (
        <div className={css.member} key={"member_" + index}>
          <strong>{index + 1}: {member.address}</strong>
          <br />
          Tokens: <span>{member.tokens}</span>
          <br />
          Reputation: <span>{member.reputation}</span>
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