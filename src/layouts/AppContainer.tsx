import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Switch, Route } from 'react-router-dom'
import { bindActionCreators } from 'redux';

import store from '../configureStore';
import { IRootState } from 'reducers';
import { IArcState } from 'reducers/arcReducer'
import { IWeb3State } from 'reducers/web3Reducer'

import * as arcActions from 'actions/arcActions';

import CreateDaoContainer from "components/CreateDao/CreateDaoContainer";
import CreateProposalContainer from "components/CreateProposal/CreateProposalContainer";
import HeaderContainer from "layouts/HeaderContainer";
import HomeContainer from "components/Home/HomeContainer";
import ViewDaoContainer from "components/ViewDao/ViewDaoContainer";

import * as css from "./App.scss"

interface IStateProps {
  arc: IArcState,
  web3: IWeb3State
}

const mapStateToProps = (state : IRootState, ownProps: any) => ({
  arc: state.arc,
  web3: state.web3
});

interface IDispatchProps {
  connectToArc: typeof arcActions.connectToArc
}

const mapDispatchToProps = {
  connectToArc: arcActions.connectToArc
};

type IProps = IStateProps & IDispatchProps

class AppContainer extends React.Component<IProps, null> {

  constructor(props : IProps) {
    super(props);
  }

  componentDidMount () {
    this.props.connectToArc();
  }

  render() {
    const { web3 } = this.props;

    return (
      (web3.isConnected ?
        <div className={css.outer}>
          <div className={css.container}>
            <HeaderContainer />
            <Switch>
              <Route exact path="/" component={HomeContainer}/>
              <Route exact path="/dao/create" component={CreateDaoContainer}/>
              <Route path="/dao/:daoAddress" component={ViewDaoContainer}/>
              <Route path="/proposition/create/:daoAddress" component={CreatePropositionContainer}/>
            </Switch>
          </div>
          <div className={css.background}></div>
        </div>
        : <div>Loading...</div>
      )
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AppContainer);

