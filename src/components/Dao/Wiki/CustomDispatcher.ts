import {
  IProposalCreateOptions,
  IProposalOutcome
} from "@daostack/client";
import * as arcActions from "actions/arcActions";
import { GenericSchemeRegistry } from "genericSchemeRegistry";

interface IDispatcherMethods {
  createProposal: typeof arcActions.createProposal;
  voteOnProposal: typeof arcActions.voteOnProposal;
}

export class CustomDispatcher {
  private methods: IDispatcherMethods;

  constructor(methods: IDispatcherMethods) {
    this.methods = methods;
  }

  public createProposal = async (proposalOptions: IProposalCreateOptions) => {
    const genericSchemeRegistry = new GenericSchemeRegistry();
    const genericSchemeInfo = genericSchemeRegistry.getSchemeInfo('');
    console.log(genericSchemeInfo)
    await this.methods.createProposal(proposalOptions);
  }

  public voteOnProposal = async (daoAvatarAddress: string, proposalId: string, voteOption: IProposalOutcome) => {
    await this.methods.voteOnProposal(daoAvatarAddress, proposalId, voteOption);
  }

}
