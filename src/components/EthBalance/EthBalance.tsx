import * as React from 'react'
import * as Web3 from 'web3';

import { IWeb3State } from 'reducers/web3Reducer'

import * as css from "./EthBalance.scss"

//import EtherscanLink from '../../components/EtherscanLink'

interface Props {
  ethAccountAddress: string,
  ethAccountBalance: string
}

export default class EthBalance extends React.Component<Props, null>  {

  constructor(props : Props) {
    super(props);
  }

  render () {
    const { ethAccountBalance } = this.props;

    // <EtherscanLink address={ ethAddress } >{ ethBalance } ETH</EtherscanLink>
    return (
      <span className={css.accountBalance}>
        { ethAccountBalance } ETH
      </span>
    )
  }
}
