import { denormalize } from "normalizr";
import { createSelector } from "reselect";

import { IRootState } from "reducers";
import { IProposalState, ProposalStates } from "reducers/arcReducer";
import * as schemas from "../schemas";

const getArcEntities = (state: IRootState) => state.arc;
const getDaos = (state: IRootState) => state.arc.daos;
const getDao = (state: IRootState, props: any) => state.arc.daos[props.match.params.daoAddress];

const getDaoProposals = createSelector(
  [getArcEntities, getDao],
  (entities, dao) => {
    if (!dao) {
      return [];
    }
    return denormalize(dao.proposals, schemas.proposalList, entities);
  },
);

export const makeDaoBoostedProposalsSelector = () => {
  return createSelector(
    [ getDaoProposals ],
    (proposals) => proposals.filter((proposal: IProposalState) => (proposal.state == ProposalStates.Boosted)),
  );
};

export const makeDaoPreBoostedProposalsSelector = () => {
  return createSelector(
    [ getDaoProposals ],
    (proposals) => proposals.filter((proposal: IProposalState) => (proposal.state == ProposalStates.PreBoosted)),
  );
};

export const makeDaoExecutedProposalsSelector = () => {
  return createSelector(
    [ getDaoProposals ],
    (proposals) => proposals.filter((proposal: IProposalState) => (proposal.state == ProposalStates.Executed || proposal.state == ProposalStates.Closed)),
  );
};

// export const makeTotalDaoReputationSelector = () => {
//   return createSelector(
//     [ getDaoMembers ],
//     (members) => members.reduce((acc : number, member) : number => (acc + member.reputation), 0)
//   );
// };

// export const makeTotalDaoTokensSelector = () => {
//   return createSelector(
//     [ getDaoMembers ],
//     (members) => members.reduce((acc : number, member) : number => (acc + member.tokens), 0)
//   );
// };
