import axios from 'axios';
import * as Arc from '@daostack/arc.js';
import promisify = require('es6-promisify');
import { normalize } from 'normalizr';
import * as Redux from 'redux';
import { push } from 'react-router-redux'
import { ThunkAction } from 'redux-thunk';
import * as Web3 from 'web3';

import * as web3Actions from 'actions/web3Actions';
import * as web3Constants from 'constants/web3Constants';
import * as arcConstants from 'constants/arcConstants';
import { IRootState } from 'reducers';
import * as schemas from '../schemas';

import { IDaoState, IMemberState, IProposalState, ProposalStates, VotesStatus } from 'reducers/arcReducer';

export function connectToArc() {
  return (dispatch : any) => {
    dispatch(web3Actions.initializeWeb3());
  }
}

export function getDAOs() {
  return async (dispatch: Redux.Dispatch<any>, getState: Function) => {
    dispatch({ type: arcConstants.ARC_GET_DAOS_PENDING, payload: null });

    const web3 = Arc.Utils.getWeb3();
    const daoCreator = await Arc.DaoCreator.deployed();

    // Get the list of daos we populated on the blockchain during genesis by looking for NewOrg events
    const newOrgEvents = daoCreator.contract.NewOrg({}, { fromBlock: 0 })
    newOrgEvents.get(async (err : Error, eventsArray : any[]) => {
      if (err) {
        dispatch({ type: arcConstants.ARC_GET_DAOS_REJECTED, payload: "Error getting new daos from genesis contract: " + err.message });
      }

      let daos = <{ [key : string] : IDaoState }>{};

      for (let index = 0; index < eventsArray.length; index++) {
        const event = eventsArray[index];
        daos[event.args._avatar] = await getDAOData(event.args._avatar, web3);
      }

      dispatch({ type: arcConstants.ARC_GET_DAOS_FULFILLED, payload: normalize(daos, schemas.daoList) });
    });
  };
}

export function getDAO(avatarAddress : string) {
  return async (dispatch: any, getState: any) => {
    dispatch({ type: arcConstants.ARC_GET_DAO_PENDING, payload: null });

    const web3 = Arc.Utils.getWeb3();
    const daoData = await getDAOData(avatarAddress, web3, true);
    dispatch({ type: arcConstants.ARC_GET_DAO_FULFILLED, payload: normalize(daoData, schemas.daoSchema) });
  }
}

export async function getDAOData(avatarAddress : string, web3 : any, detailed = false) {
  const dao = await Arc.DAO.at(avatarAddress);

  let daoData : IDaoState = {
    avatarAddress: avatarAddress,
    controllerAddress: "",
    name: await dao.getName(),
    members: {},
    rank: 1, // TODO
    promotedAmount: 0,
    proposals: [],
    reputationAddress: await dao.reputation.address,
    reputationCount: Number(web3.fromWei(await dao.reputation.totalSupply(), "ether")),
    tokenAddress: await dao.token.address,
    tokenCount: Number(web3.fromWei(await dao.token.totalSupply(), "ether")),
    tokenName: await dao.getTokenName(),
    tokenSymbol: await dao.getTokenSymbol(),
  };

  if (detailed) {
    // Get all members
    const mintTokenEvents = dao.token.Mint({}, { fromBlock: 0 })
    const transferTokenEvents = dao.token.Transfer({}, { fromBlock: 0 });
    const mintReputationEvents = dao.reputation.Mint({}, { fromBlock: 0 });
    let memberAddresses : string[] = [];

    const getMintTokenEvents = promisify(mintTokenEvents.get.bind(mintTokenEvents));
    let eventsArray = await getMintTokenEvents();
    for (let cnt = 0; cnt < eventsArray.length; cnt++) {
      memberAddresses.push(eventsArray[cnt].args.to);
    }

    const getTransferTokenEvents = promisify(transferTokenEvents.get.bind(transferTokenEvents));
    eventsArray = await getTransferTokenEvents();
    for (let cnt = 0; cnt < eventsArray.length; cnt++) {
      memberAddresses.push(eventsArray[cnt].args.to);
    }

    const getMintReputationEvents = promisify(mintReputationEvents.get.bind(mintReputationEvents));
    eventsArray = await getMintReputationEvents();
    for (let cnt = 0; cnt < eventsArray.length; cnt++) {
      memberAddresses.push(eventsArray[cnt].args.to);
    }

    memberAddresses = [...new Set(memberAddresses)]; // Dedupe

    let members : { [ key : string ] : IMemberState } = {};
    for (let cnt = 0; cnt < memberAddresses.length; cnt++) {
      const address = memberAddresses[cnt];
      let member = { address: address, tokens: 0, reputation: 0 };
      const tokens = await dao.token.balanceOf.call(address)
      member.tokens = Number(web3.fromWei(tokens, "ether"));
      const reputation = await dao.reputation.reputationOf.call(address);
      member.reputation = Number(web3.fromWei(reputation, "ether"));
      members[address] = member;
    }
    daoData.members = members;

    // Get proposals
    const contributionRewardInstance = await Arc.ContributionReward.deployed();

    // Get the voting machine (GenesisProtocol) TODO: update as Arc.js supports a better way to do this
    const schemeParamsHash = await dao.controller.getSchemeParameters(contributionRewardInstance.contract.address, dao.avatar.address);
    const schemeParams = await contributionRewardInstance.contract.parameters(schemeParamsHash);
    const votingMachineAddress = schemeParams[2];
    const votingMachineInstance = await Arc.GenesisProtocol.at(votingMachineAddress);

    const newProposalEvents = contributionRewardInstance.NewContributionProposal({}, { fromBlock: 0 });
    const getNewProposalEvents = promisify(newProposalEvents.get.bind(newProposalEvents));
    const allProposals = await getNewProposalEvents();

    const executedProposalEvents = contributionRewardInstance.ProposalExecuted({}, { fromBlock: 0 })
    const getExecutedProposalEvents = promisify(executedProposalEvents.get.bind(executedProposalEvents));
    const executedProposals = await getExecutedProposalEvents();
    const executedProposalIds = executedProposals.map((proposal : any) => proposal.args._proposalId);

    let proposalArgs : any, proposalId : string, description: string, submittedAt: number, title: string;
    for (let cnt = 0; cnt < allProposals.length; cnt++) {
      proposalArgs = allProposals[cnt].args;

      if (proposalArgs._avatar == dao.avatar.address) {
        proposalId = proposalArgs._proposalId;

        // Default to showing the description hash if we don't have better description on the server
        description = "";
        submittedAt = 0;
        title = "";

        // Get description from the server
        // TODO: pull all the proposals for this DAO in one request
        try {
          const response = await axios.get(arcConstants.API_URL + '/api/proposals?filter={"where":{"arcId":"'+proposalArgs._proposalId+'"}}');
          if (response.data.length > 0) {
            description = response.data[0].description;
            submittedAt = response.data[0].submittedAt;
            title = response.data[0].title;
          }
        } catch (e) {
          console.log(e);
        }

        const yesVotes = await votingMachineInstance.getVoteStatus({ proposalId: proposalId, vote: VotesStatus.Yes });
        const noVotes = await votingMachineInstance.getVoteStatus({ proposalId: proposalId, vote: VotesStatus.No });

        const yesStakes = await votingMachineInstance.getVoteStatus({ proposalId: proposalId, vote: VotesStatus.Yes });
        const noStakes = await votingMachineInstance.getVoteStatus({ proposalId: proposalId, vote: VotesStatus.No });

        const { totalVotes, totalStakes, votersStakes } = await votingMachineInstance.getProposalStatus({ proposalId: proposalId });

        let proposal = <IProposalState>{
          beneficiary: proposalArgs._beneficiary,
          boostedAt: 0, // TODO
          description: description,
          daoAvatarAddress: dao.avatar.address,
          state: Number(await votingMachineInstance.getState({ proposalId : proposalId })),
          proposalId: proposalId,
          rewardEth: 0, // TODO
          rewardReputation: Number(web3.fromWei(proposalArgs._reputationChange, "ether")),
          rewardToken: Number(web3.fromWei(proposalArgs._rewards[0], "ether")),
          stakesNo: Number(web3.fromWei(noStakes, "ether")),
          stakesYes: Number(web3.fromWei(yesStakes, "ether")),
          submittedAt: submittedAt,
          title: title,
          totalStakes: Number(web3.fromWei(totalStakes, "ether")),
          totalVotes: Number(web3.fromWei(totalVotes, "ether")),
          votesYes: Number(web3.fromWei(yesVotes, "ether")),
          votesNo: Number(web3.fromWei(noVotes, "ether")),
          winningVote: 0
        };

        if (executedProposalIds.includes(proposalId)) {
          //proposal.state = ProposalStates.Executed;
          proposal.winningVote = await votingMachineInstance.getWinningVote({ proposalId : proposalId });
        }

        daoData.proposals.push(proposal);
      }
    }
  }

  return daoData;
}

export function createDAO(daoName : string, tokenName: string, tokenSymbol: string, members: any) : ThunkAction<any, IRootState, null> {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    dispatch({ type: arcConstants.ARC_CREATE_DAO_PENDING, payload: null });
    try {
      const web3 : Web3 = Arc.Utils.getWeb3();

      let founders : Arc.FounderConfig[] = [], member;
      members.sort((a : any, b : any) => {
        b.reputation - a.reputation;
      });
      for (let i = 0; i < members.length; i++) {
        member = members[i];
        founders[i] = {
          address : member.address,
          tokens : web3.toWei(member.tokens, "ether"),
          reputation: web3.toWei(member.reputation, "ether")
        }
      }

      /**** TODO: use Arc.DAO.new once it supports GenesisProtocol ****/
      // let schemes = [{
      //   name: "ContributionReward"
      // }];

      // let dao = await Arc.DAO.new({
      //   name: daoName,
      //   tokenName: tokenName,
      //   tokenSymbol: tokenSymbol,
      //   founders: founders,
      //   schemes: schemes
      // });

      const daoCreator = await Arc.DaoCreator.deployed();
      let daoTransaction = await daoCreator.forgeOrg({
        name: daoName,
        tokenName: tokenName,
        tokenSymbol: tokenSymbol,
        founders: founders
      });

      const avatarAddress = daoTransaction.getValueFromTx("_avatar", "NewOrg");
      const dao = await Arc.DAO.at(avatarAddress);

      const votingMachine = await Arc.GenesisProtocol.deployed();

      const votingMachineParamsHash = (await votingMachine.setParams({
        preBoostedVoteRequiredPercentage: 50,
        preBoostedVotePeriodLimit: 60,
        boostedVotePeriodLimit: 60,
        thresholdConstA: 1,
        thresholdConstB: 1,
        minimumStakingFee: 0,
        quietEndingPeriod: 0,
        proposingRepRewardConstA: 1,
        proposingRepRewardConstB: 1,
        stakerFeeRatioForVoters: 1,
        votersReputationLossRatio: 10,
        votersGainRepRatioFromLostRep: 80,
        governanceFormulasInterface: "0x0000000000000000000000000000000000000000"
      })).result;

      const contributionReward = await Arc.ContributionReward.deployed();
      const contributionRewardParamsHash = (await contributionReward.setParams({
        orgNativeTokenFee: web3.toWei(0, "ether"),
        votingMachine: votingMachine.contract.address,
        voteParametersHash: votingMachineParamsHash
      })).result;

      const initialSchemesSchemes = [contributionReward.contract.address, votingMachine.contract.address];
      const initialSchemesParams = [contributionRewardParamsHash, votingMachineParamsHash];
      const initialSchemesPermissions = ["0x00000001", "0x00000000"];

      // register the schemes with the dao
      const tx = await daoCreator.contract.setSchemes(
        avatarAddress,
        initialSchemesSchemes,
        initialSchemesParams,
        initialSchemesPermissions
      );

      /* EO creating DAO */

      let daoData : IDaoState = {
        avatarAddress: dao.avatar.address,
        controllerAddress: dao.controller.address,
        name: daoName,
        members: {},
        rank: 1, // TODO
        promotedAmount: 0,
        proposals: [],
        reputationAddress: dao.reputation.address,
        reputationCount: 0,
        tokenAddress: dao.token.address,
        tokenCount: 0,
        tokenName: tokenName,
        tokenSymbol: tokenSymbol
      };

      dispatch({ type: arcConstants.ARC_CREATE_DAO_FULFILLED, payload: normalize(daoData, schemas.daoSchema) });
      dispatch(push('/dao/' + dao.avatar.address));
    } catch (err) {
      dispatch({ type: arcConstants.ARC_CREATE_DAO_REJECTED, payload: err.message });
    }
  } /* EO createDAO */
}

export function createProposal(daoAvatarAddress : string, title : string, description : string, nativeTokenReward: number, reputationReward: number, beneficiary: string) : ThunkAction<any, IRootState, null> {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    dispatch({ type: arcConstants.ARC_CREATE_PROPOSAL_PENDING, payload: null });
    try {
      const web3 : Web3 = Arc.Utils.getWeb3();
      const ethAccountAddress : string = getState().web3.ethAccountAddress;

      const dao = await Arc.DAO.at(daoAvatarAddress);

      const contributionRewardInstance = await Arc.ContributionReward.deployed();

      // Get the voting machine (GenesisProtocol) TODO: there will be a better way to do this in Arc.js soon
      const schemeParamsHash = await dao.controller.getSchemeParameters(contributionRewardInstance.contract.address, dao.avatar.address);
      const schemeParams = await contributionRewardInstance.contract.parameters(schemeParamsHash);
      const votingMachineAddress = schemeParams[2];
      const votingMachineInstance = await Arc.GenesisProtocol.at(votingMachineAddress);

      const submitProposalTransaction = await contributionRewardInstance.proposeContributionReward({
        avatar: daoAvatarAddress,
        beneficiary : beneficiary,
        description: description,
        nativeTokenReward : web3.toWei(nativeTokenReward, "ether"),
        numberOfPeriods: 1,
        periodLength : 1,
        reputationChange : web3.toWei(reputationReward, "ether")
      });

      // TODO: error checking

      const proposalId = submitProposalTransaction.proposalId;

      // Cast a Yes vote as the owner of the proposal?
      //const voteTransaction = await votingMachineInstance.vote({ proposalId: proposalId, vote: VotesStatus.Yes});

      const descriptionHash = submitProposalTransaction.getValueFromTx("_contributionDescription");
      const submittedAt = Math.round((new Date()).getTime() / 1000);

      // Save the proposal title, description and submitted time on the server
      try {
        const response = await axios.post(arcConstants.API_URL + '/api/proposals', {
          arcId: proposalId,
          daoAvatarAddress: daoAvatarAddress,
          descriptionHash: descriptionHash,
          description: description,
          submittedAt: submittedAt,
          title: title
        });
      } catch (e) {
        console.log(e);
      }

      const proposal = <IProposalState>{
        beneficiary: beneficiary,
        boostedAt: 0, // TODO
        description: description, // TODO
        daoAvatarAddress: daoAvatarAddress,
        state: ProposalStates.PreBoosted, // TODO: update if we do vote
        proposalId: proposalId,
        rewardEth: 0, // TODO
        rewardReputation: reputationReward,
        rewardToken: nativeTokenReward,
        stakesNo: 0,
        stakesYes: 0,
        submittedAt: submittedAt,
        title: title,
        totalStakes: 0,
        totalVotes: 0,
        votesYes: 0,
        votesNo: 0,
        winningVote: 0
      };

      let payload = normalize(proposal, schemas.proposalSchema);
      (payload as any).daoAvatarAddress = daoAvatarAddress;

      dispatch({ type: arcConstants.ARC_CREATE_PROPOSAL_FULFILLED, payload: payload });
      dispatch(push('/dao/' + daoAvatarAddress));
    } catch (err) {
      dispatch({ type: arcConstants.ARC_CREATE_PROPOSAL_REJECTED, payload: err.message });
    }
  }
}

export function voteOnProposal(daoAvatarAddress: string, proposalId: string, vote: number) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    dispatch({ type: arcConstants.ARC_VOTE_PENDING, payload: null });
    try {
      const web3 : Web3 = Arc.Utils.getWeb3();
      const ethAccountAddress : string = getState().web3.ethAccountAddress;

      const daoInstance = await Arc.DAO.at(daoAvatarAddress);
      const contributionRewardInstance = await Arc.ContributionReward.deployed();

      // TODO: clean this up once Arc.js makes it easier to get the votingMachine instance for a scheme/controller combo
      const schemeParamsHash = await daoInstance.controller.getSchemeParameters(contributionRewardInstance.contract.address, daoInstance.avatar.address);
      const schemeParams = await contributionRewardInstance.contract.parameters(schemeParamsHash);
      const votingMachineAddress = schemeParams[2]; // 2 is the index of the votingMachine address for the ContributionReward scheme
      const votingMachineInstance = await Arc.GenesisProtocol.at(votingMachineAddress);

      const voteTransaction = await votingMachineInstance.vote({ proposalId: proposalId, vote : vote} );
      const yesVotes = await votingMachineInstance.getVoteStatus({ proposalId: proposalId, vote: VotesStatus.Yes });
      const noVotes = await votingMachineInstance.getVoteStatus({ proposalId: proposalId, vote: VotesStatus.No });

      let winningVote = 0;
      try {
        winningVote = Number(voteTransaction.getValueFromTx("_decision", "ExecuteProposal"));

        // Did proposal pass?
        if (winningVote == VotesStatus.Yes) {
          // Redeem rewards if there are any instant ones. XXX: we shouldnt do this, have to switch to redeem system

          // XXX: hack to increase the time on the ganache blockchain so that enough time has passed to redeem the rewards
          //      so we can have instant rewards for demo
          await increaseTime(1);

          const redeemTransaction = await contributionRewardInstance.redeemContributionReward({
            proposalId: proposalId,
            avatar: daoAvatarAddress,
            reputation: true,
            nativeTokens: true,
            eths: true,
            externalTokens: true
          });
          // TODO: update the member reputation and tokens based on rewards? right now doing this in the reducer

          // TODO: redeem stuff from genesis for the proposer, voter and stakers if it passed?
        }
      } catch (err) {
        // The proposal was not executed
      }

      let payload = {
        daoAvatarAddress: daoAvatarAddress,
        proposal: {
          proposalId: proposalId,
          state: Number(await votingMachineInstance.getState({ proposalId : proposalId })),
          votesNo: Number(web3.fromWei(noVotes, "ether")),
          votesYes: Number(web3.fromWei(yesVotes, "ether")),
          winningVote: winningVote
        },
        dao: {
          reputationCount: Number(web3.fromWei(await daoInstance.reputation.totalSupply(), "ether")),
          tokenCount: Number(web3.fromWei(await daoInstance.token.totalSupply(), "ether"))
        }
      }

      dispatch({ type: arcConstants.ARC_VOTE_FULFILLED, payload: payload });
    } catch (err) {
      dispatch({ type: arcConstants.ARC_VOTE_REJECTED, payload: err.message });
    }
  }
}

export function stakeProposal(daoAvatarAddress: string, proposalId: string, vote: number) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    dispatch({ type: arcConstants.ARC_STAKE_PENDING, payload: null });
    try {
      const web3 : Web3 = Arc.Utils.getWeb3();
      const ethAccountAddress : string = getState().web3.ethAccountAddress;

      const daoInstance = await Arc.DAO.at(daoAvatarAddress);
      const contributionRewardInstance = await Arc.ContributionReward.deployed();

      // TODO: clean this up once Arc.js makes it easier to get the votingMachine instance for a scheme/controller combo
      const schemeParamsHash = await daoInstance.controller.getSchemeParameters(contributionRewardInstance.contract.address, daoInstance.avatar.address);
      const schemeParams = await contributionRewardInstance.contract.parameters(schemeParamsHash);
      const votingMachineAddress = schemeParams[2]; // 2 is the index of the votingMachine address for the ContributionReward scheme
      const votingMachineInstance = await Arc.GenesisProtocol.at(votingMachineAddress);

      const stakeTransaction = await votingMachineInstance.stake({ proposalId : proposalId, vote : vote, amount : web3.toWei(1, "ether")});
      const stakeStatus = await votingMachineInstance.getVoteStake({ proposalId: proposalId, vote: vote });

      console.log("Stake tr = ", stakeTransaction);

      let payload = {
        daoAvatarAddress: daoAvatarAddress,
        proposalId: proposalId,
        state: "PreBoosted",
        stakesNo: 0,
        stakesYes: 1,
      }

      // See if the proposal was executed, either passing or failing
      // const executed = voteTransaction.logs.find((log : any) => log.event == "LogExecuteProposal");
      // if (executed) {
      //   const decision = executed.args._decision.toNumber();
      //   payload.state = "Executed";
      //   if (decision == 1) {
      //     payload.winningVote = 1;
      //   } else if (decision == 2) {
      //     payload.winningVote = 2;
      //   } else {
      //     dispatch({ type: arcConstants.ARC_VOTE_REJECTED, payload: "Unknown proposal decision ", decision });
      //     return
      //   }
      // }

      dispatch({ type: arcConstants.ARC_STAKE_FULFILLED, payload: payload });
    } catch (err) {
      dispatch({ type: arcConstants.ARC_STAKE_REJECTED, payload: err.message });
    }
  }
}

async function increaseTime(duration : number) {
  const id = new Date().getTime();
  const web3 = Arc.Utils.getWeb3();

  return new Promise((resolve, reject) => {
    web3.currentProvider.sendAsync({
      jsonrpc: "2.0",
      method: "evm_increaseTime",
      params: [duration],
      id: id,
    }, err1 => {
      if (err1) {return reject(err1);}

      web3.currentProvider.sendAsync({
        jsonrpc: "2.0",
        method: "evm_mine",
        params: [],
        id: id + 1,
      }, (err2, res) => {
        return err2 ? reject(err2) : resolve(res);
      });
    });
  });
}