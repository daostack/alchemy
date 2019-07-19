import { Address, IDAOState, IMemberState } from "@daostack/client";
import { getArc } from "arc";

import BN = require("bn.js");
import AccountBalance from "components/Account/AccountBalance";
import Reputation from "components/Account/Reputation";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import * as css from "layouts/App.scss";
import * as React from "react";
import { combineLatest, of } from "rxjs";

interface IProps {
  dao: IDAOState;
  ethBalance: BN;
  genBalance: BN;
  currentAccountState: IMemberState;
}

class AccountBalances extends React.Component<IProps, null>  {

  public render(): any {
    const { dao, ethBalance, genBalance, currentAccountState } = this.props;

    return (
      <div className={css.balances}>
        <div className={css.userBalance}>
          <div>
            <AccountBalance tokenSymbol="ETH" balance={ethBalance} accountAddress={currentAccountState.address} />
          </div>
          <div>
            <AccountBalance tokenSymbol="GEN" balance={genBalance} accountAddress={currentAccountState.address} />
          </div>
        </div>
        { dao
          ? <div className={css.daoBalance}>
            <h3>{dao.name}</h3>
            <Reputation daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={currentAccountState.reputation}/>
            <label>REPUTATION</label>
          </div>
          : ""
        }
      </div>
    );
  }
}

export default (props: { dao: IDAOState; address: Address}): any => {
  //  if no DAO is given, it is unclear which token balances to show
  if (!props.dao) {
    return null;
  }
  const arc = getArc();
  const dao = arc.dao(props.dao.address);

  const observable = combineLatest(
    props.address && dao.member(props.address).state() || of(null),
    arc.ethBalance(props.address),
    arc.GENToken().balanceOf(props.address),
  );

  return <Subscribe observable={observable}>{(state: IObservableState<[IMemberState, BN, BN]>) => {
    if (state.isLoading) {
      return <div>loading..</div>;
    } else if (state.error) {
      return <div>{state.error.message}</div>;
    } else {
      const [currentAccountState,  ethBalance, genBalance] = state.data ;
      return <AccountBalances
        dao={props.dao} currentAccountState={currentAccountState} ethBalance={ethBalance} genBalance={genBalance} />;
    }
  }
  }</Subscribe>;
};
