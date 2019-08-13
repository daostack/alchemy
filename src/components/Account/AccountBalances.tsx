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
        <h2>Reputation</h2>
        { dao ?
          <div className={css.daoBalance}>
            <b>{dao.name}</b>
            <Reputation daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={currentAccountState.reputation}/>
          </div>
          :
          <div className={css.noReputation}>
              No Reputation
          </div>
        }
        <div className={css.userBalance}>
          <h2>Holdings</h2>
          <div>
            <AccountBalance tokenSymbol="ETH" balance={ethBalance} accountAddress={currentAccountState.address} />
          </div>
          <div>
            <AccountBalance tokenSymbol="GEN" balance={genBalance} accountAddress={currentAccountState.address} />
          </div>
        </div>
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

  return <Subscribe observable={observable} name="Account Balances">{(state: IObservableState<[IMemberState, BN, BN]>) => {
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
