import * as BigNumber from 'bignumber.js';
import contract = require('truffle-contract');

// Using require to get JSON to work with TypeScript
var Avatar = require('arc/contracts/Avatar.json');
var Controller = require('arc/contracts/Controller.json');
var GenesisScheme = require('arc/contracts/GenesisScheme.json');
var MintableToken = require('arc/contracts/MintableToken.json');
var Reputation = require('arc/contracts/Reputation.json');
var SimpleICO = require('arc/contracts/SimpleICO.json');

import * as web3Actions from 'actions/web3Actions';
import * as web3Constants from 'constants/web3Constants';
import * as arcConstants from 'constants/arcConstants';
import { IDaoState } from 'reducers/arcReducer';

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
  return (dispatch: any, getState: any) => {
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
              reject("Error getting new orgs from genesis contract");
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

        return getDAOData(avatarAddress, web3).then((org : IDaoState) => {
          resolve(org);
        })
      })
    })
  }
}

export function getDAOData(avatarAddress : string, web3 : any) {
  const GenesisContract = contract(GenesisScheme);
  GenesisContract.setProvider(web3.currentProvider);
  const AvatarContract = contract(Avatar);
  AvatarContract.setProvider(web3.currentProvider);
  const ControllerContract = contract(Controller);
  ControllerContract.setProvider(web3.currentProvider);
  const MintableTokenContract = contract(MintableToken);
  MintableTokenContract.setProvider(web3.currentProvider);
  const ReputationContract = contract(Reputation);
  ReputationContract.setProvider(web3.currentProvider);

  let org : IDaoState = {
    avatarAddress: avatarAddress,
    controllerAddress: "",
    name: "",
    members: 3, // TODO
    rank: 1, // TODO
    promotedAmount: 0,
    reputationAddress: "",
    reputationCount: 0,
    tokenAddress: "",
    tokenCount: 0,
    tokenName: "",
    tokenSymbol: ""
  };
  let avatarInstance : any = null;
  let controllerInstance : any = null;
  let tokenInstance : any = null;

  return AvatarContract.at(avatarAddress).then((avatarInst : any) => {
    avatarInstance = avatarInst;
    return avatarInstance.orgName();
  }).then((avatarName : string) => {
    org.name = web3.toAscii(avatarName);
    return avatarInstance.owner();
  }).then((controllerAddress : string) => {
    org.controllerAddress = controllerAddress;
    return ControllerContract.at(controllerAddress);
  }).then((controllerInst : any) => {
    controllerInstance = controllerInst;
    return controllerInstance.nativeToken();
  }).then((tokenAddress: string) => {
    org.tokenAddress = tokenAddress;
    return MintableTokenContract.at(tokenAddress);
  }).then((tokenInst : any) => {
    tokenInstance = tokenInst;
    return tokenInstance.name();
  }).then((tokenName : string) => {
    org.tokenName = tokenName;
    return tokenInstance.symbol();
  }).then((tokenSymbol : string) => {
    org.tokenSymbol = tokenSymbol;
    return tokenInstance.totalSupply();
  }).then((tokenSupply : BigNumber.BigNumber) => {
    org.tokenCount = Number(web3.fromWei(tokenSupply, "ether"));
    return controllerInstance.nativeReputation();
  }).then((reputationAddress : string) => {
    org.reputationAddress = reputationAddress;
    return ReputationContract.at(reputationAddress);
  }).then((reputationInst : any) => {
    return reputationInst.totalSupply();
  }).then((repSupply : BigNumber.BigNumber) => {
    org.reputationCount = Number(web3.fromWei(repSupply, "ether"));
    return org;
  });
}