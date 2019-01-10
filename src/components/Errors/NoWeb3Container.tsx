import * as Arc from "@daostack/arc.js";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { connect } from "react-redux";
import { Link, RouteComponentProps } from "react-router-dom";
import { CSSTransition } from "react-transition-group";

import * as web3Actions from "actions/web3Actions";
import { IRootState } from "reducers";
import { IWeb3State } from "reducers/web3Reducer";

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

class NoWeb3Container extends React.Component<IProps, null> {
  public interval: any;

  public componentDidMount() {
    this.interval = setInterval(this.props.initializeWeb3, 1000);
  }

  public componentWillUnmount() {
    clearInterval(this.interval);
  }

  public render() {
    return(
      <div className={css.wrapper}>
        <div className={css.notification}>
          <img src="/assets/images/metamask.png"/>
          <h1>You are not connected to Web3. Please install MetaMask.</h1>
          <a className={css.downloadMetamask} href="https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn">Add MetaMask from the Chrome Web Store</a>
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(NoWeb3Container);
