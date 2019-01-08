import * as React from "react";
import Subscribe, { IObservableState } from "components/Shared/Subscribe"
import gql from 'graphql-tag'

import * as css from "layouts/App.scss";

import ReputationView from "components/Account/ReputationView";
import AccountBalance from "components/Account/AccountBalance";

import { Address, IDAOState, IMemberState } from '@daostack/client'
import { arc } from 'arc'

interface Props {
  dao: IDAOState
  member: IMemberState;
}

class AccountBalances extends React.Component<Props, null>  {

  public render() {
    const { dao, member } = this.props
    // TODO: get ETH balance
    const currentAccountEthBalance = 0
    const currentAccountGenBalance =  member.tokens
    // TODO: get allowance
    const currentAccountGenStakingAllowance = 0
    // TODO: get external token balance
    const currentAccountExternalTokenBalance = 0
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
            {currentAccountGenStakingAllowance} GEN approved for staking
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
    )
  }
}

export default (props: { dao: IDAOState, address: Address}) => {
    //  if no DAO is given, it is unclear which token balances to show
    if (!props.dao) {
      return null
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
    }`
    const itemMap = (item: any) => {
      return {
        address: item.address,
        // dao: new DAO(item.dao.id, this.context),
        id: item.id,
        reputation: Number(item.reputation),
        tokens: Number(item.tokens)
      }
    }

    return <Subscribe observable={arc.getObservable(query)}>{(state: IObservableState<any>) => {
        if (state.isLoading) {
          return <div>loading..</div>
        } else if (state.error) {
          return <div>{state.error}</div>
        } else {
          // state.data is a list
          const members = state.data.data.members
          let member: any
          if (members === []) {
            member = {
              name: 'not found'
            }
          } else {
            member = itemMap(members[0])
          }
          return <AccountBalances dao={props.dao} member={member} />
        }
      }
    }</Subscribe>
}
