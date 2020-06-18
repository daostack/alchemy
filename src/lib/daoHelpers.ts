import { IDAOState, Reputation, Token } from "@daostack/arc.js";
import { getArc } from "arc";
import BN = require("bn.js");

// TODO: all this should really be in the arc.js library, after new arc.js is done i will move it there if its not already

export interface IDAOData {
  id: string;
  name: string;
  nativeReputation: {
    id: string;
    totalSupply: BN;
  };
  nativeToken: {
    id: string;
    name: string;
    symbol: string;
    totalSupply: BN;
  };
  numberOfQueuedProposals: number;
  numberOfPreBoostedProposals: number;
  numberOfBoostedProposals: number;
  register: "na"|"proposed"|"registered"|"unRegistered";
  reputationHoldersCount: number;
  metadata: string;
  metadataHash: string;
}

export function createDaoStateFromQuery(queryData: IDAOData): IDAOState {
  const arc = getArc();
  const reputation = new Reputation(arc, queryData.nativeReputation.id);
  const token = new Token(arc, queryData.nativeToken.id);
  const daoSpec: IDAOState & IDAOData = {
    ...queryData,
    address: queryData.id,
    reputation: {
      id: reputation.id,
      entity: reputation,
    },
    token: {
      id: token.id,
      entity: token,
    },
    tokenName: queryData.nativeToken.name,
    tokenSymbol: queryData.nativeToken.symbol,
    memberCount: Number(queryData.reputationHoldersCount),
    tokenTotalSupply: queryData.nativeToken.totalSupply,
    reputationTotalSupply: new BN(queryData.nativeReputation.totalSupply),
    metadata: queryData.metadata,
    metadataHash: queryData.metadataHash,
  };

  return {
    ...daoSpec,
    numberOfBoostedProposals: Number(daoSpec.numberOfBoostedProposals),
    numberOfPreBoostedProposals: Number(daoSpec.numberOfPreBoostedProposals),
    numberOfQueuedProposals: Number(daoSpec.numberOfQueuedProposals),
    reputation: {
      id: reputation.id,
      entity: reputation,
    },
    token: {
      id: token.id,
      entity: token,
    },
    tokenName: daoSpec.nativeToken.name,
    tokenSymbol: daoSpec.nativeToken.symbol,
  };
}
