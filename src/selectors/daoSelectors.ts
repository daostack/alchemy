import * as moment from 'moment';
import { denormalize } from "normalizr";
import { createSelector } from "reselect";

import { IRootState } from "reducers";
import { IProposalState, ProposalStates, closingTime } from "reducers/arcReducer";
import * as schemas from "schemas";

const getArcEntities = (state: IRootState) => state.arc;
const getDaos = (state: IRootState) => state.arc.daos;
const getDao = (state: IRootState, props: any) => state.arc.daos[props.match.params.daoAvatarAddress];

const getDaoProposals = createSelector(
  [getArcEntities, getDao],
  (entities, dao) => {
    if (!dao) {
      return [];
    }
    return denormalize(dao.proposals, schemas.proposalList, entities);
  },
);

export const createBoostedProposalsSelector = () => createSelector(
  [ getDaoProposals ],
  (proposals) => proposals.filter((proposal: IProposalState) =>
    proposal.state === ProposalStates.Boosted || proposal.state == ProposalStates.QuietEndingPeriod
  )
);

export const createPreBoostedProposalsSelector = () => createSelector(
  [ getDaoProposals ],
  (proposals) => proposals.filter((proposal: IProposalState) =>
    proposal.state === ProposalStates.PreBoosted
  ),
);

export const createOpenProposalsSelector = () => createSelector(
  [ getDaoProposals ],
  (proposals: IProposalState[]) => {
    const result = proposals.filter((proposal: IProposalState) => (
      proposal.state === ProposalStates.PreBoosted ||
      proposal.state === ProposalStates.Boosted ||
      proposal.state === ProposalStates.QuietEndingPeriod
    ));
    return result;
  }
);

export const createHistoryProposalsSelector = () => createSelector(
  [ getDaoProposals ],
  (proposals: IProposalState[]) => {
    const result = proposals.filter((proposal: IProposalState) => (
      proposal.state === ProposalStates.Executed ||
      proposal.state === ProposalStates.Closed ||
      proposal.state === ProposalStates.BoostedTimedOut ||
      proposal.state === ProposalStates.PreBoostedTimedOut
    ));

    result.sort((a, b) => closingTime(b).unix() - closingTime(a).unix())
    return result;
  }
);

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
