import { Address, IDAOState, IMemberState } from "@daostack/client";
import { ethErrorHandler } from "lib/util";

import BN = require("bn.js");
import AccountBalance from "components/Account/AccountBalance";
import Reputation from "components/Account/Reputation";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import * as css from "layouts/App.scss";
import * as React from "react";
import { combineLatest, of } from "rxjs";

interface IExternalProps {
  dao?: IDAOState;
  address: Address;
}

type IProps = IExternalProps & ISubscriptionProps<[IMemberState, BN|null, BN|null]>

class AccountBalances extends React.Component<IProps, null>  {

  public render(): RenderOutput {
    const { dao, data } = this.props;

    if (!data) {
      return null;
    }

    const [currentAccountState, ethBalance, genBalance] = data;

    return (
      <div className={css.balances}>
        <h2>Reputation</h2>
        { dao ?
          <div className={css.daoBalance}>
            <b>{dao.name}</b>
            <Reputation daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={currentAccountState.reputation} hideTooltip/>
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

export default withSubscription({
  wrappedComponent: AccountBalances,
  loadingComponent: <div>Loading..</div>,
  errorComponent: (props) => <div>{props.error.message}</div>,

  checkForUpdate: (oldProps, newProps) => {
    return oldProps.address !== newProps.address || (oldProps.dao && oldProps.dao.address) !== (newProps.dao && newProps.dao.address);
  },

  createObservable: ({ dao, address }: IExternalProps) => {
    if (!dao) {
      return of(null);
    }
    const daoState = dao;
    const arc = daoState.dao.context;
    return combineLatest(
      address && daoState.dao.member(address).state( { subscribe: true }) || of(null),
      arc.ethBalance(address).pipe(ethErrorHandler()),
      arc.GENToken().balanceOf(address).pipe(ethErrorHandler()),
    );
  },
});
