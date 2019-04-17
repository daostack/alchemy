import { Address, IDAOState, IMemberState } from "@daostack/client";
import { getArc } from "arc";
import BN = require("bn.js");
import AccountBalance from "components/Account/AccountBalance";
import ReputationView from "components/Account/ReputationView";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import * as css from "layouts/App.scss";
import { formatTokens } from "lib/util";
import * as React from "react";
import { combineLatest, of } from "rxjs";

interface Props {
  dao: IDAOState;
  ethBalance: BN;
  genAllowance: BN;
  genBalance: BN;
  currentAccountState: IMemberState;
}

class AccountBalances extends React.Component<Props, null>  {

  public render() {
    const { dao, ethBalance, genAllowance, genBalance, currentAccountState } = this.props;

    return (
      <div className={css.balances}>
        <div className={css.userBalance}>
          <div>
            <AccountBalance tokenSymbol="ETH" balance={ethBalance} accountAddress={currentAccountState.address} />
          </div>
          <div>
            <AccountBalance tokenSymbol="GEN" balance={genBalance} accountAddress={currentAccountState.address} />
          </div>
          <div>
            <span>{formatTokens(genAllowance, "GEN")}</span> approved for staking
          </div>
          {/*TODO: { dao && dao.externalTokenAddress
            ? <div>
                <AccountBalance tokenSymbol={dao.externalTokenSymbol} balance={currentAccountExternalTokenBalance} accountAddress={currentAccountState.address} />
              </div>
            : ""
          }*/}
        </div>
        { dao
          ? <div className={css.daoBalance}>
              <h3>{dao.name}</h3>
              <ReputationView daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={currentAccountState.reputation}/>
              <label>REPUTATION</label>
            </div>
          : ""
        }
      </div>
    );
  }
}

export default (props: { dao: IDAOState, address: Address}) => {
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
      arc.allowance(props.address)
    );

    return <Subscribe observable={observable}>{(state: IObservableState<[IMemberState, BN, BN, any]>) => {
        if (state.isLoading) {
          return <div>loading..</div>;
        } else if (state.error) {
          return <div>{state.error}</div>;
        } else {
          return <AccountBalances
            dao={props.dao} currentAccountState={state.data[0]} ethBalance={new BN(state.data[1])} genBalance={state.data[2]} genAllowance={new BN(state.data[3])} />;
        }
      }
    }</Subscribe>;
};
