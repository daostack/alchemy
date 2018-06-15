import { denormalize } from "normalizr";
import { createSelector } from "reselect";

import { IRootState } from "reducers";
import { IProposalState, ProposalStates } from "reducers/arcReducer";
import * as schemas from "../schemas";
import * as moment from 'moment';

const getArcEntities = (state: IRootState) => state.arc;
const getDaos = (state: IRootState) => state.arc.daos;
const getDao = (state: IRootState, props: any) => state.arc.daos[props.match.params.daoAddress];

const getDaoProposals = createSelector(
  [getArcEntities, getDao],
  (entities, dao) => {
    if (!dao) {
      return [];
    }
    let proposals = denormalize(dao.proposals, schemas.proposalList, entities);

    // Hide test proposals and proposals created outside of Alchemy when on production
    if (process.env.NODE_ENV == 'production') {
      proposals = proposals.filter((proposal: IProposalState) => {
        const title = proposal.title.toLowerCase();
        return title != "test" && title != "testy" && title != "[no title]";
      });
    }

    return proposals;
  },
);

export const createBoostedProposalsSelector = () => createSelector(
  [ getDaoProposals ],
  (proposals) => proposals.filter((proposal: IProposalState) =>
    proposal.state === ProposalStates.Boosted && (+moment() / 1000) <= proposal.boostedTime + proposal.boostedVotePeriodLimit
  )
);

export const createPreBoostedProposalsSelector = () => createSelector(
  [ getDaoProposals ],
  (proposals) => proposals.filter((proposal: IProposalState) =>
    proposal.state === ProposalStates.PreBoosted && (+moment() / 1000) <= proposal.submittedTime + proposal.preBoostedVotePeriodLimit
  ),
);

export const createHistoryProposalsSelector = () => createSelector(
  [ getDaoProposals ],
  (proposals) => proposals.filter((proposal: IProposalState) =>
    (
      proposal.state === ProposalStates.Executed ||
      proposal.state === ProposalStates.Closed ||
      proposal.state === ProposalStates.Boosted && (+moment() / 1000) > proposal.boostedTime + proposal.boostedVotePeriodLimit ||
      proposal.state === ProposalStates.PreBoosted && (+moment() / 1000) > proposal.submittedTime + proposal.preBoostedVotePeriodLimit
    )
  )
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
