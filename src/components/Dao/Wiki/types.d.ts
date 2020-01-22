import * as arcActions from "actions/arcActions";

export interface IDispatcherMethods {
  createProposal: typeof arcActions.createProposal;
  voteOnProposal: typeof arcActions.voteOnProposal;
}

export interface IProposalWikiOptions {
  methodName: string;
  methodParams: Array<string | number>;
}

export interface IDaoInformation {
  dao: string,
  scheme: string,
  contractToCall: string
}