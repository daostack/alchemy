import { Address, IDAOState, IMemberState } from "@daostack/client";
import { getArc } from "arc";
import BN = require("bn.js");
import AccountBalance from "components/Account/AccountBalance";
import Reputation from "components/Account/Reputation";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import * as css from "layouts/App.scss";
import * as React from "react";
import { combineLatest, of } from "rxjs";

interface IExternalProps {
  dao: IDAOState;
  address: Address;
}

type IProps = IExternalProps & ISubscriptionProps<[IMemberState, BN, BN]>

class AccountBalances extends React.Component<IProps, null>  {

  public render(): any {
    const { dao, data, isLoading, error } = this.props;

    if (isLoading) {
      return <div>Loading..</div>;
    } else if (error) {
      return <div>{error.message}</div>;
    } else if (!data) {
      return null;
    }

    const [currentAccountState, ethBalance, genBalance] = data;

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

export default withSubscription(
  AccountBalances,

  // Should update subscriptions?
  (oldProps, newProps) => { return oldProps.address !== newProps.address || oldProps.dao.address !== newProps.dao.address},

  // Generate observables
  ({ dao, address }: IExternalProps) => {
    if (!dao) {
      return of(null);
    }

    const arc = getArc();
    const arcDAO = arc.dao(dao.address);
    return combineLatest(
      address && arcDAO.member(address).state() || of(null),
      arc.ethBalance(address),
      arc.GENToken().balanceOf(address),
    );
  }
);