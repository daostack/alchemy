import {
  IProposalOutcome
} from "@daostack/client";
import * as arcActions from "actions/arcActions";
import { GenericSchemeRegistry, Action } from "genericSchemeRegistry";

interface IDispatcherMethods {
  createProposal: typeof arcActions.createProposal;
  voteOnProposal: typeof arcActions.voteOnProposal;
}

export class CustomDispatcher {
  private methods: IDispatcherMethods;

  constructor(methods: IDispatcherMethods) {
    this.methods = methods;
  }

  public createProposal = async (proposalOptions: any) => {
    const genericSchemeRegistry = new GenericSchemeRegistry();
    // this is going to be changed - maybe we create a script to show dynamic address based on network
    const uprtclContractAddress = '0xb279182d99e65703f0076e4812653aab85fca0f0'
    const genericSchemeInfo = genericSchemeRegistry.getSchemeInfo(uprtclContractAddress);
    const availableActions = genericSchemeInfo.actions()
    const actionCalled = availableActions.find((action: Action) => action.id === proposalOptions.methodName)
    proposalOptions['callData'] = genericSchemeInfo.encodeABI(actionCalled, proposalOptions.methodParams);
    await this.methods.createProposal(proposalOptions);
  }

  public voteOnProposal = async (daoAvatarAddress: string, proposalId: string, voteOption: IProposalOutcome) => {
    await this.methods.voteOnProposal(daoAvatarAddress, proposalId, voteOption);
  }

}
