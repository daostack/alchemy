import * as Arc from "@daostack/arc.js";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { connect } from "react-redux";
import { Link, RouteComponentProps } from "react-router-dom";
import { CSSTransition } from "react-transition-group";

import * as web3Actions from "actions/web3Actions";
import { IRootState } from "reducers";
import { IDaoState } from "reducers/arcReducer";
import { IWeb3State } from "reducers/web3Reducer";

import AccountBalance from "components/Account/AccountBalance";
import AccountImage from "components/Account/AccountImage";

import * as css from "./App.scss";

interface IStateProps {
  dao: IDaoState;
  web3State: IWeb3State;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    dao: state.arc.daos[ownProps.daoAddress],
    web3State: state.web3,
  };
};

interface IDispatchProps {
  changeAccount: typeof web3Actions.changeAccount;
}

const mapDispatchToProps = {
  changeAccount: web3Actions.changeAccount,
};

type IProps = IStateProps & IDispatchProps;

const Fade = ({ children, ...props }: any) => (
  <CSSTransition
    {...props}
    timeout={1000}
    classNames={{
     enter: css.fadeEnter,
     enterActive: css.fadeEnterActive,
     exit: css.fadeExit,
     exitActive: css.fadeExitActive,
    }}
  >
    {children}
  </CSSTransition>
);
class HeaderContainer extends React.Component<IProps, null> {

  public handleChangeAccount = (e: any) => {
    const selectElement = ReactDOM.findDOMNode(this.refs.accountSelectNode) as HTMLSelectElement;
    const newAddress = selectElement.value;
    this.props.changeAccount(newAddress);
  }

  public render() {
    const { dao, web3State } = this.props;
    const web3 = Arc.Utils.getWeb3();

    let member = dao ? dao.members[web3State.ethAccountAddress] : false;
    if (!member) {
      member = { tokens : 0, reputation: 0 };
    }

    const accountOptionNodes = web3.eth.accounts.map((account: string) => (
      <option key={"account_" + account}>
        {account}
      </option>
    ));

    return(
      <nav className={css.header}>
        <Link className={css.alchemyLogo} to="/"><img src="/assets/images/alchemy-logo.svg"/></Link>
        <span className={css.version}>v.{VERSION}#{COMMIT}</span>
        { web3
          ? <div className={css.accountInfo}>
              <div className={css.holdings}>
                <div>
                  <span className={css.holdingsLabel}>Current account</span>
                  <select onChange={this.handleChangeAccount} ref="accountSelectNode" defaultValue={web3State.ethAccountAddress}>
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
                <AccountImage accountAddress={web3State.ethAccountAddress} />
              </button>
            </div>
          : ""
        }
      </nav>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(HeaderContainer);
