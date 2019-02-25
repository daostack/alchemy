import BN = require("bn.js");
import gql from "graphql-tag";
import * as React from "react";
import { combineLatest, Observable, of } from "rxjs";

import * as css from "layouts/App.scss";

import AccountBalance from "components/Account/AccountBalance";
import ReputationView from "components/Account/ReputationView";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";

import { Address, DAO, IDAOState, IMemberState } from "@daostack/client";
import { getArc } from "arc";
import Util from "lib/util";

interface Props {
  dao: IDAOState;
  ethBalance: BN;
  genAllowance: BN;
  genBalance: BN;
  member: IMemberState;
}

class AccountBalances extends React.Component<Props, null>  {

  public render() {
    const { dao, ethBalance, genAllowance, genBalance, member } = this.props;

    return (
      <div className={css.balances}>
        <div className={css.userBalance}>
          <div>
            <AccountBalance tokenSymbol="ETH" balance={ethBalance} accountAddress={member.address} />
          </div>
          <div>
            <AccountBalance tokenSymbol="GEN" balance={genBalance} accountAddress={member.address} />
          </div>
          <div>
            <span>{Util.fromWei(genAllowance)}</span> GEN approved for staking
          </div>
          {/*TODO: { dao && dao.externalTokenAddress
            ? <div>
                <AccountBalance tokenSymbol={dao.externalTokenSymbol} balance={currentAccountExternalTokenBalance} accountAddress={member.address} />
              </div>
            : ""
          }*/}
        </div>
        { dao
          ? <div className={css.daoBalance}>
              <h3>{dao.name}</h3>
              <ReputationView daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={member.reputation}/>
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
    if (!props.address) {
      return null;
    }
    const arc = getArc();
    const dao = arc.dao(props.dao.address);

    const observable = combineLatest(
      dao.member(props.address).state(),
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
          return <AccountBalances dao={props.dao} member={state.data[0]} ethBalance={state.data[1]} genBalance={state.data[2]} genAllowance={state.data[3] ? new BN(state.data[3].amount) : new BN(0)} />;
        }
      }
    }</Subscribe>;
};
