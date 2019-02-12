import * as web3Actions from "actions/web3Actions";
import { arc } from "arc"
import * as React from "react";
import { connect } from "react-redux";
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

class NoEthAccountContainer extends React.Component<IProps, null> {
  public interval: any;

  public componentDidMount() {
    const { initializeWeb3 } = this.props;

    this.interval = setInterval(initializeWeb3, 1000);
  }

  public componentWillUnmount() {
    clearInterval(this.interval);
  }

  public enableAccountAccess = async (e: any) => {
    const web3 = arc.web3
    try {
      await (web3 as any).currentProvider.enable()
    } catch (e) {
      throw e
    }
  }

  public render() {
    return(
      <div className={css.wrapper}>
        <div className={css.notification}>
          <img src="/assets/images/metamask.png"/>
          <h1>
            In order to use Alchemy we need permission to view your public ethereum account.&nbsp;
            <a onClick={this.enableAccountAccess} className={css.link}>Click here</a> to open a Metamask pop-up that will request your permission.
          </h1>
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(NoEthAccountContainer);
