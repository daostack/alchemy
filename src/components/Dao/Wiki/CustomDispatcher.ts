import { IProposalType } from "@daostack/client";
import { GenericSchemeRegistry, Action } from "genericSchemeRegistry";
import {
  IDispatcherMethods,
  IDaoInformation,
  IProposalWikiOptions,
  IVoteOptions
} from "./types";

/**
 * This custom dispatcher is a way to pass alchemy's actions 
 * to the underscore protocol elements, this way, an user can create a proposal
 * by interacting with the wiki component.
 * 
 * It facilitates the communication between alchemy's dispatcher and 
 * underscore protocol components.
 */
export class CustomDispatcher {
  private methods: IDispatcherMethods;
  private daoInformation: IDaoInformation;

  constructor(methods: IDispatcherMethods, daoInformation: IDaoInformation) {
    this.methods = methods;
    this.daoInformation = daoInformation;
  }

  public createProposal = async (proposalWikiOptions: IProposalWikiOptions) => {
    const { dao, scheme, contractToCall } = this.daoInformation;
    const genericSchemeRegistry = new GenericSchemeRegistry();
    const genericSchemeInfo = genericSchemeRegistry.getSchemeInfo(
      contractToCall
    );
    const availableActions = genericSchemeInfo.actions();
    const actionCalled = availableActions.find(
      (action: Action) => action.id === proposalWikiOptions.methodName
    );
    const dataEncoded = genericSchemeInfo.encodeABI(
      actionCalled,
      proposalWikiOptions.methodParams
    );
    const proposalOptions = {
      dao,
      scheme,
      type: IProposalType.GenericScheme,
      value: 0, // amount of eth to send with the call
      title: actionCalled.label,
      description: actionCalled.description,
      callData: dataEncoded
    };
    await this.methods.createProposal(proposalOptions);
  };

  public voteOnProposal = async (voteParams: IVoteOptions) => {
    const { proposalId, voteOption } = voteParams;
    await this.methods.voteOnProposal(
      this.daoInformation.dao,
      proposalId,
      voteOption
    );
  };
}
