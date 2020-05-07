import { Address, DAO, IMemberState, IDAOState } from "@daostack/arc.js";
import { baseTokenName, ethErrorHandler, genName } from "lib/util";

import BN = require("bn.js");
import AccountBalance from "components/Account/AccountBalance";
import Reputation from "components/Account/Reputation";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import * as css from "layouts/App.scss";
import * as React from "react";
import { combineLatest, of, from } from "rxjs";

interface IExternalProps {
  dao?: DAO;
  address: Address;
}

type IProps = IExternalProps & ISubscriptionProps<[IMemberState, BN|null, BN|null, IDAOState]>

class AccountBalances extends React.Component<IProps, null> {

  public render(): RenderOutput {
    const { dao, data } = this.props;

    if (!data) {
      return null;
    }

    const [currentAccountState, ethBalance, genBalance, daoState] = data;

    return (
      <div className={css.balances}>
        <h2>Reputation</h2>
        { dao ?
          <div className={css.daoBalance}>
            <b>{daoState.name}</b>
            <Reputation daoName={daoState.name} totalReputation={daoState.reputationTotalSupply} reputation={currentAccountState.reputation} hideTooltip/>
          </div>
          :
          <div className={css.noReputation}>
              No Reputation
          </div>
        }
        <div className={css.userBalance}>
          <h2>Holdings</h2>
          <div>
            <AccountBalance tokenSymbol={baseTokenName()} balance={ethBalance} accountAddress={currentAccountState.address} />
          </div>
          <div>
            <AccountBalance tokenSymbol={genName()} balance={genBalance} accountAddress={currentAccountState.address} />
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
    const oldDao = oldProps.dao;
    const newDao = newProps.dao;
    return !oldDao || !newDao || oldDao.id !== newDao.id;
  },

  createObservable: ({ dao, address }: IExternalProps) => {
    if (!dao) {
      return of(null);
    }
    const arc = dao.context;
    return combineLatest(
      address && dao.member(address).state( { subscribe: true }) || of(null),
      arc.ethBalance(address).pipe(ethErrorHandler()),
      arc.GENToken().balanceOf(address).pipe(ethErrorHandler()),
      from(dao.fetchState())
    );
  },
});
