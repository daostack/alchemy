import { schema } from "normalizr";

export const accountSchema = new schema.Entity("accounts", {}, { idAttribute: (value) => `${value.address}-${value.daoAvatarAddress}` });
export const daoSchema = new schema.Entity("daos", {}, { idAttribute: "avatarAddress" });
export const proposalSchema = new schema.Entity("proposals", {}, { idAttribute: "proposalId" });
export const redemptionSchema = new schema.Entity("redemptions", {}, { idAttribute: (value) => `${value.proposalId}-${value.accountAddress}` });
export const stakeSchema = new schema.Entity("stakes", {}, { idAttribute: (value) => `${value.proposalId}-${value.stakerAddress}` });
export const voteSchema = new schema.Entity("votes", {}, { idAttribute: (value) => `${value.proposalId}-${value.voterAddress}` });

export const accountList = new schema.Array(accountSchema);
export const daoList = new schema.Array(daoSchema);
export const proposalList = new schema.Array(proposalSchema);
export const redemptionList = new schema.Array(redemptionSchema);
export const stakeList = new schema.Array(stakeSchema);
export const voteList = new schema.Array(voteSchema);

accountSchema.define({
  redemptions: redemptionList,
  stakes: stakeList,
  votes: voteList
});

daoSchema.define({
  members: accountList,
  proposals: proposalList
});

proposalSchema.define({
  redemptions: redemptionList,
  stakes: stakeList,
  votes: voteList
});
