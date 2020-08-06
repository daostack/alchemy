import BN = require("bn.js");
import * as React from "react";

import { ITokenTradeProposalState } from "@daostack/arc.js";
import { formatTokens, tokenDetails } from "lib/util";


interface IProps {
  proposalState: ITokenTradeProposalState;
  separator?: string;
}

export default class TradeString extends React.Component<IProps, null> {
  public render(): RenderOutput {
    const { proposalState } = this.props;
    let receiveToken;
    let sendToken;

    if (proposalState.sendTokenAddress && proposalState.sendTokenAmount && proposalState.sendTokenAmount.gt(new BN(0))) {
      const tokenData = tokenDetails(proposalState.sendTokenAddress);
      sendToken = formatTokens(new BN(proposalState.sendTokenAmount), tokenData ? tokenData["symbol"] : "?", tokenData ? tokenData["decimals"] : 18);
    }

    if (proposalState.receiveTokenAddress && proposalState.receiveTokenAmount && proposalState.receiveTokenAmount.gt(new BN(0))) {
      const tokenData = tokenDetails(proposalState.receiveTokenAddress);
      receiveToken = formatTokens(new BN(proposalState.receiveTokenAmount), tokenData ? tokenData["symbol"] : "?", tokenData ? tokenData["decimals"] : 18);
    }

    return <strong>
      <p>{proposalState.beneficiary}</p><br/>
      { sendToken && <><p>Sends: {sendToken}</p><br/></> }
      { receiveToken && <><p>Receives: {receiveToken}</p><br/></> }
    </strong>;
  }
}
