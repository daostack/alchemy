import * as React from "react";
import { connect, Dispatch } from 'react-redux';

import { IStateShape } from 'reducers';
import { IArcState } from 'reducers/arcReducer';
import DaoList from 'components/DaoList/DaoList';

import * as arcActions from 'actions/arcActions';

import * as css from './Home.scss';

interface IStateProps {
  arc: IArcState,
}

const mapStateToProps = (state : IStateShape, ownProps: any) => ({
  arc: state.arc,
});

interface IDispatchProps {
  getDAOList: typeof arcActions.getDAOList
}

const mapDispatchToProps = {
  getDAOList: arcActions.getDAOList
};

type IProps = IStateProps & IDispatchProps

class HomeContainer extends React.Component<IProps, null> {

  render() {
    return (
      <div className={css.homeWrapper}>
        <DaoList daoList={this.props.arc.daoList} getDAOList={this.props.getDAOList} />
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(HomeContainer);