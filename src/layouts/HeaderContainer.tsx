import * as Arc from '@daostack/arc.js';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Link, RouteComponentProps } from 'react-router-dom'
import { connect } from 'react-redux';

import { IDaoState, IMemberState } from 'reducers/arcReducer'
import { IWeb3State } from 'reducers/web3Reducer'
import { IRootState } from 'reducers';
import * as web3Actions from 'actions/web3Actions';

import AccountBalance from 'components/Account/AccountBalance'

import * as css from "./App.scss"

interface IStateProps {
  dao: IDaoState
  web3State: IWeb3State
}

const mapStateToProps = (state : IRootState, ownProps: any) => {
  return {
    dao: state.arc.daos[ownProps.daoAddress],
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
    const { dao, web3State } = this.props;
    const web3 = Arc.Utils.getWeb3();

    let member = dao ? dao.members[web3State.ethAccountAddress] : false;
    if (!member) {
      member = { tokens : 0, reputation: 0 };
    }

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
                  <span className={css.holdingsLabel}>Account Balances: </span>
                  <AccountBalance tokenSymbol="ETH" balance={web3State.ethAccountBalance} accountAddress={web3State.ethAccountAddress} />
                  { dao
                    ? <div>
                        <AccountBalance tokenSymbol={dao.tokenSymbol} balance={member.tokens} accountAddress={web3State.ethAccountAddress} />
                        &nbsp; | &nbsp;
                        <span>{member.reputation} {dao.name} reputation</span>
                      </div>
                    : ""
                  }
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