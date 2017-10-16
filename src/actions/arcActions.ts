import * as BigNumber from 'bignumber.js';
import promisify = require('es6-promisify');
import * as Redux from 'redux';
import { push } from 'react-router-redux'
import { ThunkAction } from 'redux-thunk';
import contract = require('truffle-contract');
import * as Web3 from 'web3';

// Using require to get JSON to work with TypeScript
var Avatar = require('arc/build/contracts/Avatar.json');
var Controller = require('arc/build/contracts/Controller.json');
var DAOToken = require('arc/build/contracts/DAOToken.json');
var GenesisScheme = require('arc/build/contracts/GenesisScheme.json');
var GlobalConstraintRegistrar = require('arc/build/contracts/GlobalConstraintRegistrar.json');
var MintableToken = require('arc/build/contracts/MintableToken.json');
var Reputation = require('arc/build/contracts/Reputation.json');
var SchemeRegistrar = require('arc/build/contracts/SchemeRegistrar.json');
var SimpleContributionScheme = require('arc/build/contracts/SimpleContributionScheme.json');
var SimpleICO = require('arc/build/contracts/SimpleICO.json');
var AbsoluteVote = require('arc/build/contracts/AbsoluteVote.json');
var UpgradeScheme = require('arc/build/contracts/UpgradeScheme.json');

import * as web3Actions from 'actions/web3Actions';
import * as web3Constants from 'constants/web3Constants';
import * as arcConstants from 'constants/arcConstants';
import { IRootState } from 'reducers';
import { IDaoState, ICollaborator, IProposal } from 'reducers/arcReducer';

export function connectToArc() {
  return (dispatch : any) => {
    dispatch(web3Actions.initializeWeb3()).then((results: any) => {
      dispatch(getArcAdresses(results.payload.instance));
    });
  }
}

// TODO: use async/await instead of redux-promise
export function getArcAdresses(web3 : any) {
  return (dispatch: any, getState: any) => {
    return dispatch({
      type: arcConstants.ARC_INITIALIZATION,
      payload: new Promise((resolve, reject) => {

        let payload = {
          controllerAddress: <string> null,
          controllerInstance: <any> null,
          currentNetworkId : <string> null,
          isCorrectChain: false,
          genesisAddress: GenesisScheme.networks[web3Constants.CURRENT_CHAIN_ID]['address'], // TODO: use .deployed() instead?
          simpleICOAddress: SimpleICO.networks[web3Constants.CURRENT_CHAIN_ID]['address'],
        };

        if (web3 != null) {
          web3.version.getNetwork((err : any, currentNetworkId : string) => {
            if (err) {
              reject("Failed to get web3 network");
            }

            const isCorrectChain = web3Constants.CURRENT_CHAIN_ID == currentNetworkId;

            payload.currentNetworkId = currentNetworkId;
            payload.isCorrectChain = isCorrectChain;
          });
          resolve(payload);
        }
        reject("Failed to get arc addresses, don't know why");
      })
    });
  };
}

// TODO: use async/await instead of redux-promise
export function getDAOList() {
  return (dispatch: Redux.Dispatch<any>, getState: Function) => {
    return dispatch({
      type: arcConstants.ARC_GET_DAOS,
      payload: new Promise((resolve, reject) => {
        const web3 = getState().web3.instance;

        const GenesisContract = contract(GenesisScheme);
        GenesisContract.setProvider(web3.currentProvider);

        const genesisAddress = GenesisScheme.networks[web3Constants.CURRENT_CHAIN_ID]['address'];

        GenesisContract.at(genesisAddress).then((genesisInstance : any) => {
          // Get the list of orgs we populated on the blockchain during genesis by looking for NewOrg events
          const newOrgEvents = genesisInstance.NewOrg({}, { fromBlock: 0 })
          newOrgEvents.get((err : Error, eventsArray : any[]) => {
            if (err) {
              reject("Error getting new orgs from genesis contract: " + err.message);
            }

            let orgs = <{ [key : string] : IDaoState }>{};

            // Do some promise magic to get all the info we need about each Org
            const promise = eventsArray.reduce(function(promise, event) {
              return promise.then(function() {
                return getDAOData(event.args._avatar, web3).then((org : IDaoState) => {
                  orgs[event.args._avatar] = org;
                });
              });
            }, Promise.resolve()).then(() => {
              resolve(orgs);
            });
          });
        });
      })
    });
  }
}

// TODO: use async/await instead of redux-promise
export function getDAO(avatarAddress : string) {
  return (dispatch: any, getState: any) => {
    return dispatch({
      type: arcConstants.ARC_GET_DAO,
      payload: new Promise((resolve, reject) => {
        const web3 = getState().web3.instance;

        return getDAOData(avatarAddress, web3, true).then((org : IDaoState) => {
          resolve(org);
        })
      })
    })
  }
}

export async function getDAOData(avatarAddress : string, web3 : any, detailed = false) {
  const AbsoluteVoteContract = contract(AbsoluteVote);
  AbsoluteVoteContract.setProvider(web3.currentProvider);
  const AvatarContract = contract(Avatar);
  AvatarContract.setProvider(web3.currentProvider);
  const ControllerContract = contract(Controller);
  ControllerContract.setProvider(web3.currentProvider);
  const DAOTokenContract = contract(MintableToken);
  DAOTokenContract.setProvider(web3.currentProvider);
  const ReputationContract = contract(Reputation);
  ReputationContract.setProvider(web3.currentProvider);
  const SimpleContributionSchemeContract = contract(SimpleContributionScheme);
  SimpleContributionSchemeContract.setProvider(web3.currentProvider);

  let org : IDaoState = {
    avatarAddress: avatarAddress,
    controllerAddress: "",
    name: "",
    members: [],
    rank: 1, // TODO
    promotedAmount: 0,
    proposals: [],
    reputationAddress: "",
    reputationCount: 0,
    tokenAddress: "",
    tokenCount: 0,
    tokenName: "",
    tokenSymbol: ""
  };

  const avatarInstance = await AvatarContract.at(avatarAddress);
  org.name = web3.toAscii(await avatarInstance.orgName());
  org.controllerAddress = await avatarInstance.owner();
  const controllerInstance = await ControllerContract.at(org.controllerAddress);
  org.tokenAddress = await controllerInstance.nativeToken();
  const tokenInstance = DAOTokenContract.at(org.tokenAddress);
  org.tokenName = await tokenInstance.name();
  org.tokenSymbol = await tokenInstance.symbol();
  org.tokenCount = Number(web3.fromWei(await tokenInstance.totalSupply(), "ether"));
  org.reputationAddress = await controllerInstance.nativeReputation();
  const reputationInstance = await ReputationContract.at(org.reputationAddress);
  org.reputationCount = Number(web3.fromWei(await reputationInstance.totalSupply(), "ether"));

  if (detailed) {
    // Get all collaborators
    const mintTokenEvents = tokenInstance.Mint({}, { fromBlock: 0 })
    const transferTokenEvents = tokenInstance.Transfer({}, { fromBlock: 0 });
    const mintReputationEvents = reputationInstance.Mint({}, { fromBlock: 0 });
    let collaboratorAddresses : string[] = [];

    const getMintTokenEvents = promisify(mintTokenEvents.get.bind(mintTokenEvents));
    let eventsArray = await getMintTokenEvents();
    for (let cnt = 0; cnt < eventsArray.length; cnt++) {
      collaboratorAddresses.push(eventsArray[cnt].args.to);
    }

    const getTransferTokenEvents = promisify(transferTokenEvents.get.bind(transferTokenEvents));
    eventsArray = await getTransferTokenEvents();
    for (let cnt = 0; cnt < eventsArray.length; cnt++) {
      collaboratorAddresses.push(eventsArray[cnt].args.to);
    }

    const getMintReputationEvents = promisify(mintReputationEvents.get.bind(mintReputationEvents));
    eventsArray = await getMintReputationEvents();
    for (let cnt = 0; cnt < eventsArray.length; cnt++) {
      collaboratorAddresses.push(eventsArray[cnt].args.to);
    }

    collaboratorAddresses = [...new Set(collaboratorAddresses)]; // Dedupe

    let collaborators : ICollaborator[] = [];
    for (let cnt = 0; cnt < collaboratorAddresses.length; cnt++) {
      const address = collaboratorAddresses[cnt];
      let collaborator = { address: address, tokens: 0, reputation: 0 };
      const tokens = await tokenInstance.balanceOf.call(address)
      collaborator.tokens = Number(web3.fromWei(tokens, "ether"));
      const reputation = await reputationInstance.reputationOf.call(address);
      collaborator.reputation = Number(web3.fromWei(reputation, "ether"));
      collaborators.push(collaborator);
    }
    org.members = collaborators;

    // Get proposals
    const votingMachineInstance = await AbsoluteVoteContract.deployed();
    const simpleContributionInstance = await SimpleContributionSchemeContract.deployed();
    const newProposalEvents = simpleContributionInstance.LogNewContributionProposal({}, { fromBlock: 0 })
    const getNewProposalEvents = promisify(newProposalEvents.get.bind(newProposalEvents));
    const allProposals = await getNewProposalEvents();

    const executedProposalEvents = simpleContributionInstance.LogProposalExecuted({}, { fromBlock: 0 })
    const getExecutedProposalEvents = promisify(executedProposalEvents.get.bind(executedProposalEvents));
    const executedProposals = await getExecutedProposalEvents();
    const executedProposalIds = executedProposals.map((proposal : any) => proposal.args._proposalId);

    const failedProposalEvents = simpleContributionInstance.LogProposalDeleted({}, { fromBlock: 0 })
    const getFailedProposalEvents = promisify(failedProposalEvents.get.bind(failedProposalEvents));
    const failedProposals = await getFailedProposalEvents();
    const failedProposalIds = failedProposals.map((proposal : any) => proposal.args._proposalId);

    let proposalArgs : any;
    for (let cnt = 0; cnt < allProposals.length; cnt++) {
      proposalArgs = allProposals[cnt].args;
      if (proposalArgs._avatar == org.avatarAddress) {
        let proposal = <IProposal>{
          abstainVotes: 0,
          beneficiary: proposalArgs._beneficiary,
          description: proposalArgs._contributionDesciption,
          failed: false,
          noVotes: 0,
          open: true,
          passed: false,
          proposalId: proposalArgs._proposalId,
          reputationReward: Number(web3.fromWei(proposalArgs._reputationReward, "ether")),
          tokenReward: Number(web3.fromWei(proposalArgs._nativeTokenReward, "ether")),
          yesVotes: 0
        };

        if (executedProposalIds.includes(proposalArgs._proposalId)) {
          proposal.passed = true;
          proposal.open = false;
        } else if (failedProposalIds.includes(proposalArgs._proposalId)) {
          proposal.failed = true;
          proposal.open = false;
        } else {
          const proposalStatus = await votingMachineInstance.proposalStatus(proposalArgs._proposalId);
          proposal.abstainVotes = proposalStatus[0].toNumber();
          proposal.yesVotes = proposalStatus[1].toNumber();
          proposal.noVotes = proposalStatus[2].toNumber();
        };
        org.proposals.push(proposal);
      }
    }
  }

  return org;
}

export function createDAO(orgName : string, tokenName: string, tokenSymbol: string, collaborators: any) : ThunkAction<any, IRootState, null> {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    dispatch({ type: arcConstants.ARC_CREATE_DAO_PENDING, payload: null });
    try {
      // TODO: use arcjs instead of contracts directly. but artifacts.require doesnt work in those files.
      // const founders = [ {
      //   address: getState().web3.ethAccountAddress,
      //   tokens: 1000,
      //   reputation: 10
      // }];
      // const newDao = Organization.new({ orgName, tokenName, tokenSymbol });

      const web3 : Web3 = getState().web3.instance;

      const AvatarContract = contract(Avatar);
      AvatarContract.setProvider(web3.currentProvider);
      const ControllerContract = contract(Controller);
      ControllerContract.setProvider(web3.currentProvider);
      const DAOTokenContract = contract(DAOToken);
      DAOTokenContract.setProvider(web3.currentProvider);
      const GenesisContract = contract(GenesisScheme);
      GenesisContract.setProvider(web3.currentProvider);
      const GlobalConstraintRegistrarContract = contract(GlobalConstraintRegistrar);
      GlobalConstraintRegistrarContract.setProvider(web3.currentProvider);
      const ReputationContract = contract(Reputation);
      ReputationContract.setProvider(web3.currentProvider);
      const SchemeRegistrarContract = contract(SchemeRegistrar);
      SchemeRegistrarContract.setProvider(web3.currentProvider);
      const SimpleContributionSchemeContract = contract(SimpleContributionScheme);
      SimpleContributionSchemeContract.setProvider(web3.currentProvider);
      const AbsoluteVoteContract = contract(AbsoluteVote);
      AbsoluteVoteContract.setProvider(web3.currentProvider);
      const UpgradeSchemeContract = contract(UpgradeScheme);
      UpgradeSchemeContract.setProvider(web3.currentProvider);

      let org : IDaoState = {
        avatarAddress: null,
        controllerAddress: "",
        name: "",
        members: [],
        rank: 1, // TODO
        promotedAmount: 0,
        proposals: [],
        reputationAddress: "",
        reputationCount: 0,
        tokenAddress: "",
        tokenCount: 0,
        tokenName: "",
        tokenSymbol: ""
      };

      const genesisAddress = GenesisScheme.networks[web3Constants.CURRENT_CHAIN_ID]['address'];
      const genesisInstance = await GenesisContract.at(genesisAddress);

      const founderAddresses = collaborators.map((c : any) => c.address);
      const founderTokens = collaborators.map((c : any) => web3.toWei(c.tokens, "ether"));
      const founderReputations = collaborators.map((c : any) => web3.toWei(c.reputation, "ether"));

      // TODO: how do we know how much gas to spend?
      const forgeOrgTransaction = await genesisInstance.forgeOrg(orgName, tokenName, tokenSymbol, founderAddresses, founderTokens, founderReputations, { gas: 4000000 });

      org.avatarAddress = forgeOrgTransaction.logs[0].args._avatar;
      const avatarInstance = await AvatarContract.at(org.avatarAddress);
      org.controllerAddress = await avatarInstance.owner();
      const controllerInstance = await ControllerContract.at(org.controllerAddress);

      org.tokenAddress = await controllerInstance.nativeToken();
      const tokenInstance = DAOTokenContract.at(org.tokenAddress);

      org.reputationAddress = await controllerInstance.nativeReputation();
      const reputationInstance = ReputationContract.at(org.reputationAddress);

      const votePrecision = 50; // percentage to pass proposals. TODO: pass this in

      const votingMachineInstance = await AbsoluteVoteContract.deployed();
      const allowOwnerVote = true; // Whether the owner of the proposal automatically votes yes on proposals they create
      await votingMachineInstance.setParameters(org.reputationAddress, votePrecision, allowOwnerVote);
      const voteParametersHash = await votingMachineInstance.getParametersHash(org.reputationAddress, votePrecision, allowOwnerVote);

      const globalConstraintRegistrarInstance = await GlobalConstraintRegistrarContract.deployed();
      const schemeRegistrarInstance = await SchemeRegistrarContract.deployed();
      const upgradeSchemeInstance = await UpgradeSchemeContract.deployed();

      let initialSchemesAddresses = [];
      let initialSchemesParams = [];
      let initialSchemesTokenAddresses = [];
      let initialSchemesFees = [];
      let initialSchemesPermissions = [];

      await schemeRegistrarInstance.setParameters(voteParametersHash, voteParametersHash, votingMachineInstance.address);
      initialSchemesAddresses.push(schemeRegistrarInstance.address);
      initialSchemesParams.push(await schemeRegistrarInstance.getParametersHash(voteParametersHash, voteParametersHash, votingMachineInstance.address));
      initialSchemesTokenAddresses.push(await schemeRegistrarInstance.nativeToken());
      initialSchemesFees.push(await schemeRegistrarInstance.fee());
      initialSchemesPermissions.push('0x00000003'); // Docs in Controller.sol

      await upgradeSchemeInstance.setParameters(voteParametersHash, votingMachineInstance.address);
      initialSchemesAddresses.push(upgradeSchemeInstance.address);
      initialSchemesParams.push(await upgradeSchemeInstance.getParametersHash(voteParametersHash, votingMachineInstance.address));
      initialSchemesTokenAddresses.push(await upgradeSchemeInstance.nativeToken());
      initialSchemesFees.push(await upgradeSchemeInstance.fee());
      initialSchemesPermissions.push('0x00000009');

      await globalConstraintRegistrarInstance.setParameters(voteParametersHash, votingMachineInstance.address);
      initialSchemesAddresses.push(globalConstraintRegistrarInstance.address);
      initialSchemesParams.push(await globalConstraintRegistrarInstance.getParametersHash(voteParametersHash, votingMachineInstance.address));
      initialSchemesTokenAddresses.push(await globalConstraintRegistrarInstance.nativeToken());
      initialSchemesFees.push(await globalConstraintRegistrarInstance.fee());
      initialSchemesPermissions.push('0x00000005');

      // register the schemes with the organization
      await genesisInstance.setInitialSchemes(
        org.avatarAddress,
        initialSchemesAddresses,
        initialSchemesParams,
        initialSchemesTokenAddresses,
        initialSchemesFees,
        initialSchemesPermissions,
        { gas: 4000000 }
      );

      // transfer what we need for fees to register the organization at the given schemes
      // TODO: check if we have the funds, if not, throw an exception
      // fee = await org.schemeRegistrar.fee())
      // we must do this after setInitialSchemes, because that one approves the transactions
      // (but that logic should change)
      let token, fee, scheme;
      for (let i=0; i < initialSchemesAddresses.length; i = i + 1) {
        scheme = await SchemeRegistrarContract.at(initialSchemesAddresses[i]);
        if (initialSchemesTokenAddresses[i] != "0x0000000000000000000000000000000000000000") {
          token = DAOTokenContract.at(initialSchemesTokenAddresses[i]);
          fee  = initialSchemesFees[i];
          await token.transfer(org.avatarAddress, fee);
        }
        await scheme.registerOrganization(org.avatarAddress);
      }

      // XXX: for now give all orgs a SimpleContributionScheme. Has to happen via a proposal? (TODO: Adam says it could be registered in the inititalSchemes too, but it wasnt working for me)
      const simpleContributionSchemeInstance = await SimpleContributionSchemeContract.deployed();

      const simpleContributionParametersHash = await simpleContributionSchemeInstance.getParametersHash(0, 0, voteParametersHash, votingMachineInstance.address);
      await simpleContributionSchemeInstance.setParameters(
        0, // uint orgNativeTokenFee; // a fee (in the organization's token) that is to be paid for submitting a contribution
        0, // uint schemeNativeTokenFee; // a fee (in the present schemes token)  that is to be paid for submission
        voteParametersHash, // bytes32 voteApproveParams;
        votingMachineInstance.address,
      );

      // This will actually pass the proposal automatically because my vote for yes is registered on proposal.
      const proposeSchemeTransaction = await schemeRegistrarInstance.proposeScheme(
        org.avatarAddress, // Avatar _avatar,
        simpleContributionSchemeInstance.address, //address _scheme,
        simpleContributionParametersHash, // bytes32 _parametersHash,
        false, // bool _isRegistering,
        org.tokenAddress, // StandardToken _tokenFee,
        0, // uint _fee
        false, // bool _autoRegister. TODO: if we make this true then we shouldnt have to do the registerOrganization call below
        { gas: 4000000 }
      );

      // now we register it
      await simpleContributionSchemeInstance.registerOrganization(org.avatarAddress, { gas : 4000000 });

      dispatch({ type: arcConstants.ARC_CREATE_DAO_FULFILLED, payload: org });
      dispatch(push('/dao/' + org.avatarAddress));
    } catch (err) {
      dispatch({ type: arcConstants.ARC_CREATE_DAO_REJECTED, payload: err.message });
    }
  } /* EO createDAO */
}

export function createProposition(orgAvatarAddress : string, description : string, nativeTokenReward: number, reputationReward: number, beneficiary: string) : ThunkAction<any, IRootState, null> {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    dispatch({ type: arcConstants.ARC_CREATE_PROPOSITION_PENDING, payload: null });
    try {
      const web3 : Web3 = getState().web3.instance;
      const ethAccountAddress : string = getState().web3.ethAccountAddress;

      const SimpleContributionSchemeContract = contract(SimpleContributionScheme);
      SimpleContributionSchemeContract.setProvider(web3.currentProvider);
      const simpleContributionSchemeInstance = await SimpleContributionSchemeContract.deployed();

      const submitProposalTransaction = await simpleContributionSchemeInstance.submitContribution(
        orgAvatarAddress,
        description,
        web3.toWei(nativeTokenReward, "ether"), // uint _nativeTokenReward,
        web3.toWei(reputationReward, "ether"), // uint _reputationReward,
        0, // uint _ethReward,
        '0x0008e8314d3f08fd072e06b6253d62ed526038a0', // StandardToken _externalToken, we provide some arbitrary address
        0, // uint _externalTokenReward,
        beneficiary, // address _beneficiary
        { from: ethAccountAddress, gas : 4000000 }
      );

      // const AbsoluteVoteContract = contract(AbsoluteVote);
      // AbsoluteVoteContract.setProvider(web3.currentProvider);
      // const votingMachineInstance = await AbsoluteVoteContract.deployed();
      // const proposalX = await votingMachineInstance.proposals(submitProposalTransaction.logs[0].args._proposalId);
      // console.log(" vot mach prop = ", proposalX);

      const proposal = <IProposal>{
        abstainVotes: 0,
        beneficiary: beneficiary,
        description: description,
        failed: false,
        noVotes: 0,
        open: true,
        orgAvatarAddress: orgAvatarAddress,
        passed: false, // TODO: This could actually be true if owner had enough rep, should probably pull the updated proposal info from the voting machine
        proposalId: submitProposalTransaction.logs[0].args._proposalId,
        reputationReward: reputationReward,
        tokenReward: nativeTokenReward,
        yesVotes: 0, // TODO: actually this is probably the reputation of the opener with ownerVote turned on.
      };

      dispatch({ type: arcConstants.ARC_CREATE_PROPOSITION_FULFILLED, payload: proposal });
      dispatch(push('/dao/' + orgAvatarAddress));
    } catch (err) {
      dispatch({ type: arcConstants.ARC_CREATE_PROPOSITION_REJECTED, payload: err.message });
    }
  }
}

export function voteOnProposition(proposalId: string, voterAddress: string, vote: number) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    dispatch({ type: arcConstants.ARC_VOTE_PENDING, payload: null });
    try {
      const web3 : Web3 = getState().web3.instance;

      const AbsoluteVoteContract = contract(AbsoluteVote);
      AbsoluteVoteContract.setProvider(web3.currentProvider);
      const votingMachineInstance = await AbsoluteVoteContract.deployed();
      // TODO: from the right person
      await votingMachineInstance.vote(proposalId, vote, { from: "0x403a1879cfd1499e1d6c5de4d0914659c40cf96a", gas: 4000000 });
      // TODO: update proposal by checking status of the vote from the voting machine instance

      dispatch({ type: arcConstants.ARC_VOTE_FULFILLED, payload: null });
    } catch (err) {
      dispatch({ type: arcConstants.ARC_VOTE_REJECTED, payload: err.message });
    }
  }
}