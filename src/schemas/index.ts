import { schema } from "normalizr";

const accountSchema = new schema.Entity("accounts", {}, { idAttribute: (value) => `${value.address}-${value.daoAvatarAddress}` });
const daoSchema = new schema.Entity("daos", {}, { idAttribute: "address" });
const proposalSchema = new schema.Entity("proposals", {}, { idAttribute: "proposalId" });
const redemptionSchema = new schema.Entity("redemptions", {}, { idAttribute: (value) => `${value.proposalId}-${value.accountAddress}` });
const stakeSchema = new schema.Entity("stakes", {}, { idAttribute: (value) => `${value.proposalId}-${value.stakerAddress}` });
const voteSchema = new schema.Entity("votes", {}, { idAttribute: (value) => `${value.proposalId}-${value.voterAddress}` });

const accountList = new schema.Array(accountSchema);
const proposalList = new schema.Array(proposalSchema);
const redemptionList = new schema.Array(redemptionSchema);
const stakeList = new schema.Array(stakeSchema);
const voteList = new schema.Array(voteSchema);

accountSchema.define({
  redemptions: redemptionList,
  stakes: stakeList,
  votes: voteList,
});

daoSchema.define({
  members: accountList,
  proposals: proposalList,
});

proposalSchema.define({
  redemptions: redemptionList,
  stakes: stakeList,
  votes: voteList,
});
