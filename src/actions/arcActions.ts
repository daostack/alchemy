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
var SimpleICO = require('arc/build/contracts/SimpleICO.json');
var SimpleVote = require('arc/build/contracts/SimpleVote.json');
var UpgradeScheme = require('arc/build/contracts/UpgradeScheme.json');

import * as web3Actions from 'actions/web3Actions';
import * as web3Constants from 'constants/web3Constants';
import * as arcConstants from 'constants/arcConstants';
import { IRootState } from 'reducers';
import { IDaoState, ICollaborator } from 'reducers/arcReducer';

export function connectToArc() {
  return (dispatch : any) => {
    dispatch(web3Actions.initializeWeb3()).then((results: any) => {
      dispatch(getArcAdresses(results.payload.instance));
    });
  }
}

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
          genesisAddress: GenesisScheme.networks[web3Constants.CURRENT_CHAIN_ID]['address'],
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
  const AvatarContract = contract(Avatar);
  AvatarContract.setProvider(web3.currentProvider);
  const ControllerContract = contract(Controller);
  ControllerContract.setProvider(web3.currentProvider);
  const DAOTokenContract = contract(MintableToken);
  DAOTokenContract.setProvider(web3.currentProvider);
  const ReputationContract = contract(Reputation);
  ReputationContract.setProvider(web3.currentProvider);

  let org : IDaoState = {
    avatarAddress: avatarAddress,
    controllerAddress: "",
    name: "",
    members: [], // TODO
    rank: 1, // TODO
    promotedAmount: 0,
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
      const SimpleVoteContract = contract(SimpleVote);
      SimpleVoteContract.setProvider(web3.currentProvider);
      const UpgradeSchemeContract = contract(UpgradeScheme);
      UpgradeSchemeContract.setProvider(web3.currentProvider);

      let org : IDaoState = {
        avatarAddress: null,
        controllerAddress: "",
        name: "",
        members: [], // TODO
        rank: 1, // TODO
        promotedAmount: 0,
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

      org.tokenAddress = await controllerInstance.nativeToken();
      const tokenInstance = DAOTokenContract.at(org.tokenAddress);

      org.reputationAddress = await controllerInstance.nativeReputation();
      const reputationInstance = ReputationContract.at(org.reputationAddress);

      const votePrecision = 50; // TODO: set this

      const votingMachineInstance = await SimpleVoteContract.deployed(); // TODO: what does deployed() do? can i use it instead of the GenesisScheme.networks thing?
      await votingMachineInstance.setParameters(org.reputationAddress, votePrecision);

      const voteParametersHash = await votingMachineInstance.getParametersHash(org.reputationAddress, votePrecision);

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
      initialSchemesPermissions.push('0x00000003'); // TODO: where does this come from?

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
        token = DAOTokenContract.at(initialSchemesTokenAddresses[i]);
        fee  = initialSchemesFees[i];
        await token.transfer(org.avatarAddress, fee);
        await scheme.registerOrganization(org.avatarAddress);
      }

      dispatch({ type: arcConstants.ARC_CREATE_DAO_FULFILLED, payload: org });
      dispatch(push('/dao/' + org.avatarAddress));
    } catch (err) {
      dispatch({ type: arcConstants.ARC_CREATE_DAO_REJECTED, payload: err.message });
    }
  }
}