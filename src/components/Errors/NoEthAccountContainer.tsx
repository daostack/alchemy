import * as Arc from "@daostack/arc.js";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { connect } from "react-redux";
import { Link, RouteComponentProps } from "react-router-dom";
import { CSSTransition } from "react-transition-group";

import * as web3Actions from "actions/web3Actions";
import { IRootState } from "reducers";
import { IWeb3State } from "reducers/web3Reducer";

import * as home from "../Home/Home.scss";
import * as css from "./Errors.scss";

interface IStateProps {
  web3State: IWeb3State;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    web3State: state.web3,
  };
};

interface IDispatchProps {
  initializeWeb3: typeof web3Actions.initializeWeb3;
}

const mapDispatchToProps = {
  initializeWeb3: web3Actions.initializeWeb3,
};

type IProps = IStateProps & IDispatchProps;

declare global {
  interface Window { origin: any; }
}

class NoEthAccountContainer extends React.Component<IProps, null> {
  public interval: any;

  public componentDidMount() {
    const { initializeWeb3 } = this.props;

    this.interval = setInterval(initializeWeb3, 1000);
  }

  public componentWillUnmount() {
    clearInterval(this.interval);
  }

  public render() {
    return(
      <div className={css.wrapper}>
        <div className={css.notification}>
          <img src="/assets/images/metamask.png"/>
          <h1>Found Web3 but there is no default account available.<br/>Please make sure that MetaMask is unlocked.</h1>
          <div className={home.topCta}>
            <a href={window.origin + '/explorer'}>Explore Alchemy</a>
          </div>
          <div className={home.topCta}>
            <a className={home.topCta} href={window.origin + '/graphiql'}>Explore Alchemy (Advanced)</a>
          </div>
        </div>
        <div className={css.unlockMetamask}>
          Make sure <img className={css.icon} src="/assets/images/metamask-icon.png"/> Metamask is unlocked! <img src="/assets/images/metamask-arrow.svg"/>
        </div>

      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(NoEthAccountContainer);
