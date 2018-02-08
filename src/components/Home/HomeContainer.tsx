import { denormalize } from 'normalizr';
import * as React from "react";
import { connect, Dispatch } from 'react-redux';
import { Link } from 'react-router-dom'

import { IRootState } from 'reducers';
import { IDaoState } from 'reducers/arcReducer';
import DaoList from 'components/DaoList/DaoList';

import * as arcActions from 'actions/arcActions';
import * as schemas from '../../schemas';

import * as css from './Home.scss';

interface IStateProps {
  daos: { [key : string] : IDaoState }
}

const mapStateToProps = (state : IRootState, ownProps: any) => ({
  daos: denormalize(state.arc.daos, schemas.daoList, state.arc)
});

interface IDispatchProps {
  getDAOs: typeof arcActions.getDAOs
}

const mapDispatchToProps = {
  getDAOs: arcActions.getDAOs
};

type IProps = IStateProps & IDispatchProps

class HomeContainer extends React.Component<IProps, null> {

  render() {
    return (
      <div className={css.homeWrapper}>
        <DaoList daos={this.props.daos} getDAOs={this.props.getDAOs} />
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(HomeContainer);