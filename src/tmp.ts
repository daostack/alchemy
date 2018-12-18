import { IDAOState } from '@daostack/client'
import { IDaoState } from "reducers/arcReducer";

// TODO: This function exists only for pruposes of refactoring the caching layer
// and should be completely removed in time
export function mockLegacyDaoState(dao: IDAOState ) {
  const legacyDao: IDaoState = {
    avatarAddress: dao.address,
    controllerAddress: undefined,
    currentThresholdToBoost: undefined,
    ethCount: 0,
    externalTokenCount: 0,
    externalTokenSymbol: 'TDB',
    genCount: 0,
    lastBlock: 0, // The last block on the chain processed for this DAO
    members: [],
    name: dao.name,
    rank: 0,
    promotedAmount: 0,
    proposals: [],
    proposalsLoaded: false,
    reputationAddress: '',
    reputationCount: 0,
    tokenAddress: '',
    tokenCount: 0,
    tokenName: dao.tokenName,
    tokenSupply: dao.tokenTotalSupply,
    tokenSymbol: dao.tokenSymbol
  }
  return legacyDao
}
