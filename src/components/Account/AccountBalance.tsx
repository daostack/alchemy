import BN = require("bn.js");
import * as React from "react";
import * as css from "./Account.scss";
import Util from "lib/util";

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
    console.log("balance = ", balance);

    return (
      <span className={css.accountBalance}>
        {Util.fromWei(balance).toFixed(2).toLocaleString()} {tokenSymbol}
      </span>
    );
  }
}
