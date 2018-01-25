import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Link } from 'react-router-dom'
import { connect } from 'react-redux';

import { IWeb3State } from 'reducers/web3Reducer'
import { IRootState } from 'reducers';
import * as web3Actions from 'actions/web3Actions';

import EthBalance from 'components/EthBalance/EthBalance'

import * as css from "./App.scss"

interface IStateProps {
  web3: IWeb3State
}

const mapStateToProps = (state : IRootState, ownProps: any) => {
  return {
    web3: state.web3
  };
};

interface IDispatchProps {
  changeAccount: typeof web3Actions.changeAccount
}

const mapDispatchToProps = {
  changeAccount: web3Actions.changeAccount
};

type IProps = IStateProps & IDispatchProps


class HeaderContainer extends React.Component<IProps, null> {

  handleChangeAccount = (e : any) => {
    let selectElement = ReactDOM.findDOMNode(this.refs.accountSelectNode) as HTMLSelectElement;
    const newAddress = selectElement.value;
    this.props.changeAccount(newAddress);
  }

  render() {
    const { web3 } = this.props;

    const accountOptionNodes = web3.instance.eth.accounts.map((account : string) => (
      <option key={'account_' + account}>
        {account}
      </option>
    ));

    return(
      <nav className={css.header}>
        <Link to='/'><img src='/assets/images/Emergent+-+White@2x.png' height='100' /></Link>
        <h1>Welcome to the Emergent ecosystem</h1>
        { web3
          ? <div className={css.accountInfo}>
              <span>Current account:</span>
              <select onChange={this.handleChangeAccount} ref='accountSelectNode' defaultValue={web3.ethAccountAddress}>
                {accountOptionNodes}
              </select>&nbsp;-&nbsp;
              <span className={css.etherBalance}>Ether Balance <EthBalance ethAccountBalance={web3.ethAccountBalance} ethAccountAddress={web3.ethAccountAddress} /> </span>
            </div>
          : ""
        }
      </nav>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(HeaderContainer);