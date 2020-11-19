import { DAO, IDAOState, Reputation, Token } from "@daostack/arc.js";
import { getArc } from "arc";
import BN = require("bn.js");
import { Networks } from "./util";

// TODO: all this should really be in the client library, after new client is done i will move it there if its not already

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
}

export function createDaoStateFromQuery(queryData: IDAOData, network: Networks): IDAOState {
  const arc = getArc(network);
  const reputation = new Reputation(queryData.nativeReputation.id, arc);
  const token = new Token(queryData.nativeToken.id, arc);
  const daoSpec = {
    ...queryData,
    address: queryData.id,
    reputation,
    token,
    tokenName: queryData.nativeToken.name,
    tokenSymbol: queryData.nativeToken.symbol,
  };
  const dao = new DAO(daoSpec, arc);

  return {
    ...daoSpec,
    dao,
    memberCount: Number(daoSpec.reputationHoldersCount),
    numberOfBoostedProposals: Number(daoSpec.numberOfBoostedProposals),
    numberOfPreBoostedProposals: Number(daoSpec.numberOfPreBoostedProposals),
    numberOfQueuedProposals: Number(daoSpec.numberOfQueuedProposals),
    reputation,
    reputationTotalSupply: new BN(daoSpec.nativeReputation.totalSupply),
    token,
    tokenName: daoSpec.nativeToken.name,
    tokenSymbol: daoSpec.nativeToken.symbol,
    tokenTotalSupply: daoSpec.nativeToken.totalSupply,
  };
}
