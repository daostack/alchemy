import * as React from "react";
import * as css from "./Account.scss";

interface Props {
  accountAddress: string;
  balance: number;
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
        {balance.toFixed(2).toLocaleString()} {tokenSymbol}
      </span>
    );
  }
}
