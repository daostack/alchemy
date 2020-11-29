import * as BN from "bn.js";
import { formatTokens } from "lib/util";
import * as React from "react";

interface IProps {
  accountAddress: string;
  balance: BN;
  tokenSymbol: string;
}

export default class Balance extends React.Component<IProps, null> {

  constructor(props: IProps) {
    super(props);
  }

  public render(): RenderOutput {
    const { balance, tokenSymbol } = this.props;

    return (
      <span>
        {formatTokens(balance, tokenSymbol)}
      </span>
    );
  }
}
