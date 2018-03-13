import * as React from "react";
import * as Web3 from "web3";

import { IWeb3State } from "reducers/web3Reducer";

import * as css from "./Account.scss";

//import EtherscanLink from '../../components/EtherscanLink'

interface Props {
  accountAddress: string;
  balance: number | string;
  tokenSymbol: string;
}

export default class Balance extends React.Component<Props, null>  {

  constructor(props: Props) {
    super(props);
  }

  public render() {
    const { balance, tokenSymbol } = this.props;

    // <EtherscanLink address={ ethAddress } >{ ethBalance } ETH</EtherscanLink>
    return (
      <span className={css.accountBalance}>
        {balance} {tokenSymbol}
      </span>
    );
  }
}
