import Arc, { Address, IDAOState, IMemberState } from "@daostack/arc.js";
import { baseTokenName, ethErrorHandler, genName, ethBalance, standardPolling, Networks } from "lib/util";

import * as BN from "bn.js";
import AccountBalance from "components/Account/AccountBalance";
import Reputation from "components/Account/Reputation";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import * as css from "layouts/App.scss";
import * as React from "react";
import { combineLatest, of } from "rxjs";

interface IExternalProps {
  dao?: IDAOState;
  arc: Arc;
  network: Networks;
  address: Address;
}

type IProps = IExternalProps & ISubscriptionProps<[Address, IMemberState, BN|null, BN|null]>

class AccountBalances extends React.Component<IProps, null> {

  public render(): RenderOutput {
    const { dao, data, network } = this.props;

    const [currentAccountAddress, currentAccountState, ethBalance, genBalance] = data;

    return (
      <div className={css.balances}>
        { (dao && currentAccountState) ?
          <div className={css.repBalance}>
            <div className={css.title}>Reputation</div>
            <div className={css.rep}>
              <div>{dao.name}</div>
              <div className={css.underline}></div>
              <div><Reputation daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={currentAccountState.reputation} hideTooltip /></div>
            </div>
          </div> : dao ?
            <div className={css.noReputation}>
            No Reputation
            </div> : ""
        }
        { currentAccountAddress ?
          <div className={css.holdingsBalace}>
            <div className={css.title}>Holdings</div>
            <AccountBalance tokenSymbol={baseTokenName(network)} balance={ethBalance} accountAddress={currentAccountAddress} />
            <AccountBalance tokenSymbol={genName(network)} balance={genBalance} accountAddress={currentAccountAddress} />
          </div>
          : "" }
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

  createObservable: ({ dao, arc, address, network }: IExternalProps) => {
    if (!arc) {
      return of([]);
    }
    const addrs = address?.toLowerCase();
    return combineLatest(
      addrs,
      (addrs && dao && dao.dao.member(addrs).state( standardPolling())) || of(null),
      ethBalance(addrs, arc, network).pipe(ethErrorHandler()),
      arc?.GENToken().balanceOf(addrs).pipe(ethErrorHandler()),
    );
  },
});
