import BN = require("bn.js");
import Util from "lib/util";
import * as React from "react";
import * as css from "./Account.scss";

interface Props {
  accountAddress: string;
  balance: BN;
  tokenSymbol: string;
}

export default class Balance extends React.Component<Props, null>  {

  constructor(props: Props) {
    super(props);
  }

  public render() {
    const { balance, tokenSymbol } = this.props;

    return (
      <span className={css.accountBalance}>
        {Util.fromWei(balance).toFixed(2).toLocaleString()} {tokenSymbol}
      </span>
    );
  }
}
