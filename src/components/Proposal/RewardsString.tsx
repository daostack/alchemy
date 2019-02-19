import * as React from "react";

import Util from "lib/util"

import { IDAOState, IProposalState } from '@daostack/client'
import ReputationView from "components/Account/ReputationView";

interface IProps {
  dao: IDAOState;
  proposal: IProposalState;
  separator?: string;
}

export default class RewardsString extends React.Component<IProps, null> {
  public render() {
    const { dao, proposal, separator } = this.props;

    const rewards = [];
    if (proposal.ethReward) {
      rewards.push(Util.fromWei(proposal.ethReward).toFixed(2).toLocaleString() + " ETH");
    }
    if (proposal.externalTokenReward) {
      rewards.push(Util.fromWei(proposal.externalTokenReward).toFixed(2).toLocaleString() + " " + dao.externalTokenSymbol);
    }
    if (proposal.nativeTokenReward) {
      rewards.push(Util.fromWei(proposal.nativeTokenReward).toFixed(2).toLocaleString() + " " + dao.tokenSymbol);
    }
    if (proposal.reputationReward) {
      rewards.push(
        <ReputationView daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={proposal.reputationReward}/>
      );
    }
    return <strong>{rewards.reduce((acc, v) => acc == null ? <React.Fragment>{v}</React.Fragment> : <React.Fragment>{acc} <em>{separator || "+"}</em> {v}</React.Fragment>, null)}</strong>;
  }
}
