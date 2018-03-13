import { schema } from "normalizr";

export const daoSchema = new schema.Entity("daos", {}, { idAttribute: "avatarAddress" });
export const proposalSchema = new schema.Entity("proposals", {}, { idAttribute: "proposalId" });

export const daoList = new schema.Array(daoSchema);
export const proposalList = new schema.Array(proposalSchema);

daoSchema.define({
  proposals: proposalList,
});
