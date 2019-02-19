import BN = require("bn.js");
import gql from "graphql-tag";

import * as React from "react";

import * as css from "layouts/App.scss";

import AccountBalance from "components/Account/AccountBalance";
import ReputationView from "components/Account/ReputationView";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";

import { Address, DAO, IDAOState, IMemberState } from "@daostack/client";
import { getArc } from "arc";
import Util from "lib/util";

interface Props {
  dao: IDAOState;
  member: IMemberState;
}

const TokenAllowance = (props: {accountAddress: Address, daoAddress: Address}) => {
  // TODO: move query logic to daostack/client
  // TODO: we are net filtering by spender (which is the votingMachine associated with the proposal)
  // but we probably should, in the future.
  const arc = getArc();
  const query = gql`{
    tokenApprovals (where: {owner: "${props.accountAddress}"} ){
      id
      contract
      owner
      spender
      value
    }
  }`;
  return <Subscribe observable={arc.getObservable(query)}>{(state: IObservableState<any>) => {
    if (state.isLoading) {
      return <div>loading..</div>;
    } else if (state.error) {
      return <div>{state.error}</div>;
    } else {
      // state.data is a list
      const approvals = state.data.data.tokenApprovals;
      if (approvals.length === 0) {
        return <span>0</span>;
      } else {
        const approval = approvals[0]; // TODO: if there are mnay this may be wrong
        return <span>{approval.value}</span>;
      }
    }
  }}</Subscribe >;
};

class AccountBalances extends React.Component<Props, null>  {

  public render() {
    const { dao, member } = this.props;
    // TODO: get ETH balance
    const currentAccountEthBalance = new BN(0);
    const currentAccountGenBalance = member.tokens;
    // TODO: get allowance
    // const currentAccountGenStakingAllowance = 0
    // TODO: get external token balance
    const currentAccountExternalTokenBalance = new BN(0);

    return (
      <div className={css.balances}>
        <div className={css.userBalance}>
          <div>
            <AccountBalance tokenSymbol="ETH" balance={currentAccountEthBalance} accountAddress={member.address} />
          </div>
          <div>
            <AccountBalance tokenSymbol="GEN" balance={currentAccountGenBalance} accountAddress={member.address} />
          </div>
          <div>
             <TokenAllowance accountAddress={member.address} daoAddress={dao.address} /> GEN approved for staking
          </div>
          { dao && dao.externalTokenAddress
            ? <div>
                <AccountBalance tokenSymbol={dao.externalTokenSymbol} balance={currentAccountExternalTokenBalance} accountAddress={member.address} />
              </div>
            : ""
          }
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
    // TODO: move query logic to daostack/client
    const query = gql`{
      members (where: {address: "${props.address}", dao: "${props.dao.address}"}) {
        id
        address
        dao {
          id
        }
        reputation
        tokens
      }
    }`;
    const itemMap = (item: any) => {
      return {
        address: item.address,
        // dao: new DAO(item.dao.id, this.context),
        id: item.id,
        reputation: new BN(item.reputation),
        tokens: new BN(item.tokens)
      };
    };
    const arc = getArc();

    return <Subscribe observable={arc.getObservable(query)}>{(state: IObservableState<any>) => {
        if (state.isLoading) {
          return <div>loading..</div>;
        } else if (state.error) {
          return <div>{state.error}</div>;
        } else {
          // state.data is a list
          const members = state.data.data.members;
          let member: any;
          if (members.length === 0) {
            member = {
              name: "not found",
              id: "0x",
              address: "0x",
              reputation: new BN(0),
              tokens: new BN(0)
            };
          } else {
            member = itemMap(members[0]);
          }
          return <AccountBalances dao={props.dao} member={member} />;
        }
      }
    }</Subscribe>;
};
