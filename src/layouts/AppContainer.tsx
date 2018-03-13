import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Route, Switch } from "react-router-dom";
import { bindActionCreators } from "redux";

import { IRootState } from "reducers";
import { IArcState } from "reducers/arcReducer";
import { ConnectionStatus, IWeb3State } from "reducers/web3Reducer";
import store from "../configureStore";

import * as arcActions from "actions/arcActions";

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
  web3: IWeb3State;
}

const mapStateToProps = (state: IRootState, ownProps: any) => ({
  arc: state.arc,
  connectionStatus: state.web3.connectionStatus,
  ethAccountAddress: state.web3.ethAccountAddress,
  web3: state.web3,
});

interface IDispatchProps {
  connectToArc: typeof arcActions.connectToArc;
}

const mapDispatchToProps = {
  connectToArc: arcActions.connectToArc,
};

type IProps = IStateProps & IDispatchProps;

class AppContainer extends React.Component<IProps, null> {

  constructor(props: IProps) {
    super(props);
  }

  public componentDidMount() {
    this.props.connectToArc();
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
