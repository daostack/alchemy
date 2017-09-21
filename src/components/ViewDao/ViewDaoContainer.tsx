import * as React from 'react';
import { connect, Dispatch } from 'react-redux';

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IDaoState, ICollaborator } from 'reducers/arcReducer';

import * as css from './ViewDao.scss';

interface IStateProps {
  dao: any,
  daoAddress : string
}

const mapStateToProps = (state : IRootState, ownProps: any) => {
  return {
    dao: state.arc.daoList[ownProps.match.params.daoAddress],
    daoAddress : ownProps.match.params.daoAddress
  };
};

interface IDispatchProps {
  getDAO: typeof arcActions.getDAO
}

const mapDispatchToProps = {
  getDAO: arcActions.getDAO
};

type IProps = IStateProps & IDispatchProps

class ViewDaoContainer extends React.Component<IProps, null> {

  componentDidMount() {
    this.props.getDAO(this.props.daoAddress);
  }

  render() {
    const { dao } = this.props;

    return(
      dao ?
        <div className={css.wrapper}>
          <h1>Viewing Dao: {dao.name}</h1>
          <div>Token: {dao.tokenName} ({dao.tokenSymbol})</div>
          <div>Num tokens: {dao.tokenCount}</div>
          <div>Omega: {dao.reputationCount}</div>
          {this.renderMembers()}
        </div>
       : <div>Loading... </div>
    );
  }

  renderMembers() {
    const { dao } = this.props;

    const membersHTML = dao.members.map((member : ICollaborator, index : number) => {
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
      <div className={css.members}>
        <h2>Members</h2>
        {membersHTML}
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewDaoContainer);