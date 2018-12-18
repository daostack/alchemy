import * as React from "react";

import { IDaoState, IProposalState, ProposalStates, proposalEnded } from "reducers/arcReducer";
import ReputationView from "components/Account/ReputationView";
import { IDAOState } from '@daostack/client'

interface IProps {
  dao: IDaoState;
  proposal: IProposalState;
  separator?: string;
}

export default class RewardsString extends React.Component<IProps, null> {
  public render() {
    const { dao, proposal, separator } = this.props;

    let rewards = [];
    if (proposal.ethReward) {
      rewards.push(proposal.ethReward.toFixed(2).toLocaleString() + " ETH");
    }
    if (proposal.externalTokenReward) {
      rewards.push(proposal.externalTokenReward.toFixed(2).toLocaleString() + " " + dao.externalTokenSymbol);
    }
    if (proposal.nativeTokenReward) {
      rewards.push(proposal.nativeTokenReward.toFixed(2).toLocaleString() + " " + dao.tokenSymbol);
    }
    if (proposal.reputationChange) {
      rewards.push(
        <ReputationView daoName={dao.name} totalReputation={dao.reputationCount} reputation={proposal.reputationChange}/>
      );
    }
    return <strong>{rewards.reduce((acc, v) => acc == null ? <React.Fragment>{v}</React.Fragment> : <React.Fragment>{acc} <em>{separator || "and"}</em> {v}</React.Fragment>, null)}</strong>;
  }
}
