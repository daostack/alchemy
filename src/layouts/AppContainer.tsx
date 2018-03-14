import * as Arc from '@daostack/arc.js';
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Route, Switch } from "react-router-dom";
import { bindActionCreators } from "redux";

import { IRootState } from "reducers";
import { IArcState } from "reducers/arcReducer";
import { ConnectionStatus, IWeb3State } from "reducers/web3Reducer";
import store from "../configureStore";

import * as web3Actions from 'actions/web3Actions';

import CreateDaoContainer from "components/CreateDao/CreateDaoContainer";
import CreateProposalContainer from "components/CreateProposal/CreateProposalContainer";
import NoEthAccountContainer from "components/Errors/NoEthAccountContainer";
import NoWeb3Container from "components/Errors/NoWeb3Container";
import HomeContainer from "components/Home/HomeContainer";
import ViewDaoContainer from "components/ViewDao/ViewDaoContainer";
import HeaderContainer from "layouts/HeaderContainer";

import * as css from "./App.scss";

interface IStateProps {
  arc: IArcState;
  connectionStatus: ConnectionStatus;
  ethAccountAddress: string | null;
}

const mapStateToProps = (state: IRootState, ownProps: any) => ({
  arc: state.arc,
  connectionStatus: state.web3.connectionStatus,
  ethAccountAddress: state.web3.ethAccountAddress,
});

interface IDispatchProps {
  initializeWeb3: any;
  changeAccount: any;
}

const mapDispatchToProps = {
  initializeWeb3: web3Actions.initializeWeb3,
  changeAccount: web3Actions.changeAccount,
};

type IProps = IStateProps & IDispatchProps;

class AppContainer extends React.Component<IProps, null> {
  accountInterval: any;

  constructor(props: IProps) {
    super(props);
  }

  public async componentDidMount () {
    const { initializeWeb3} = this.props;
    initializeWeb3();
  }

  componentWillReceiveProps(props : IProps) {
    // If we are connected to an account through web3
    if (props.ethAccountAddress) {
      // Setup an interval to check for the account to change (e.g. via MetaMask)
      // First clear the old interval
      if (this.accountInterval) {
        clearInterval(this.accountInterval);
      }

      this.accountInterval = setInterval(async function(accountAddress : string) {
        const newAccount = await Arc.Utils.getDefaultAccount();
        if (newAccount !== accountAddress) {
          this.props.changeAccount(newAccount);
        }
      }.bind(this, props.ethAccountAddress), 400);
    }
  }

  public render() {
    const { connectionStatus, ethAccountAddress } = this.props;

    return (
      (connectionStatus === ConnectionStatus.Pending
        ? <div className={css.loading}>Loading...</div>
      : connectionStatus === ConnectionStatus.Failed
        ? <NoWeb3Container />
      : ethAccountAddress === null
        ? <NoEthAccountContainer />
      : connectionStatus == ConnectionStatus.Connected
        ? <div className={css.outer}>
            <div className={css.container}>
              <Route path="/dao/:daoAddress" children={(props) => (
                <HeaderContainer daoAddress={props.match ? props.match.params.daoAddress : null} />
              )} />
              <Switch>
                <Route exact path="/" component={HomeContainer}/>
                <Route exact path="/dao/create" component={CreateDaoContainer}/>
                <Route path="/dao/:daoAddress" component={ViewDaoContainer}/>
                <Route exact path="/proposal/create/:daoAddress" component={CreateProposalContainer}/>
              </Switch>
            </div>
            <div className={css.background}></div>
          </div>
        : <div className={css.loading}>Something weird happened, please contact the DAOstack team...</div>
      )
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(AppContainer);
