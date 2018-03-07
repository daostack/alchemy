import * as Arc from '@daostack/arc.js';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Link, RouteComponentProps } from 'react-router-dom'
import { connect } from 'react-redux';
import { CSSTransition } from 'react-transition-group';

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IWeb3State } from 'reducers/web3Reducer'

import * as css from "./Errors.scss"

interface IStateProps {
  web3State: IWeb3State
}

const mapStateToProps = (state : IRootState, ownProps: any) => {
  return {
    web3State: state.web3
  };
};

interface IDispatchProps {
  connectToArc: typeof arcActions.connectToArc
}

const mapDispatchToProps = {
  connectToArc: arcActions.connectToArc
};

type IProps = IStateProps & IDispatchProps

class NoEthAccountContainer extends React.Component<IProps, null> {
   interval : any;

  componentDidMount() {
    const { connectToArc } = this.props;

    this.interval = setInterval(connectToArc, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    return(
      <div className={css.wrapper}>
        Found Web3 but there is no default account available. Please make sure that MetaMask is unlocked.
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(NoEthAccountContainer);