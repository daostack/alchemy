import * as Arc from '@daostack/arc.js';
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
  web3State: IWeb3State
}

const mapStateToProps = (state : IRootState, ownProps: any) => {
  return {
    web3State: state.web3
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
    const { web3State } = this.props;
    const web3 = Arc.Utils.getWeb3();

    const accountOptionNodes = web3.eth.accounts.map((account : string) => (
      <option key={'account_' + account}>
        {account}
      </option>
    ));

    return(
      <nav className={css.header}>
        <Link className={css.alchemyLogo} to='/'><img src='/assets/images/alchemy-logo.svg'/></Link>
        { web3
          ? <div className={css.accountInfo}>
              <div className={css.holdings}>
                <div>
                  <span className={css.holdingsLabel}>Current account</span>
                  <select onChange={this.handleChangeAccount} ref='accountSelectNode' defaultValue={web3State.ethAccountAddress}>
                    {accountOptionNodes}
                  </select>
                </div>
                <div>
                  <span className={css.holdingsLabel}>Ether Balance </span>
                  <EthBalance ethAccountBalance={web3State.ethAccountBalance} ethAccountAddress={web3State.ethAccountAddress} />
                </div>
              </div>
              <button className={css.profileLink}>
                <img src='/assets/images/user-profile-icon.svg'/>
              </button>
            </div>
          : ""
        }
      </nav>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(HeaderContainer);