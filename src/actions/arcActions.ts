import * as Arc from "@daostack/arc.js";
import axios from "axios";
import promisify = require("es6-promisify");
import * as _ from "lodash";
import { normalize } from "normalizr";
import { push } from "react-router-redux";
import * as Redux from "redux";
import { ThunkAction } from "redux-thunk";
import * as Web3 from "web3";

import * as notificationsActions from "actions/notificationsActions";
import * as web3Actions from "actions/web3Actions";
import * as arcConstants from "constants/arcConstants";
import * as web3Constants from "constants/web3Constants";
import Util from "lib/util";
import { IRootState } from "reducers";
import * as schemas from "../schemas";

import { IAccountState, IDaoState, IProposalState, IStakeState, ProposalStates, TransactionStates, VoteOptions } from "reducers/arcReducer";

export function getDAOs() {
  return async (dispatch: Redux.Dispatch<any>, getState: Function) => {
    dispatch({ type: arcConstants.ARC_GET_DAOS_PENDING, payload: null });

    const daoCreator = await Arc.DaoCreator.deployed();

    // Get the list of daos we populated on the blockchain during genesis by looking for NewOrg events
    const newOrgEvents = daoCreator.InitialSchemesSet({}, { fromBlock: 0 });
    newOrgEvents.get(async (err: Error, eventsArray: any[]) => {
      if (err) {
        dispatch({ type: arcConstants.ARC_GET_DAOS_REJECTED, payload: "Error getting new daos from genesis contract: " + err.message });
      }

      const daos = {} as { [key: string]: IDaoState };

      for (let index = 0; index < eventsArray.length; index++) {
        const event = eventsArray[index];
        daos[event.args._avatar] = await getDAOData(event.args._avatar);
      }

      dispatch({ type: arcConstants.ARC_GET_DAOS_FULFILLED, payload: normalize(daos, schemas.daoList) });
    });
  };
}

export function getDAO(avatarAddress: string) {
  return async (dispatch: any, getState: any) => {
    dispatch({ type: arcConstants.ARC_GET_DAO_PENDING, payload: null });

    const currentAccountAddress: string = getState().web3.ethAccountAddress;
    const daoData = await getDAOData(avatarAddress, currentAccountAddress);

    dispatch({ type: arcConstants.ARC_GET_DAO_FULFILLED, payload: normalize(daoData, schemas.daoSchema) });
  };
}

export async function getDAOData(avatarAddress: string, currentAccountAddress: string = null) {
  const web3 = Arc.Utils.getWeb3();
  const dao = await Arc.DAO.at(avatarAddress);

  const daoData: IDaoState = {
    avatarAddress,
    controllerAddress: "",
    name: await dao.getName(),
    members: {},
    rank: 1, // TODO
    promotedAmount: 0,
    proposals: [],
    proposalsLoaded: false,
    reputationAddress: await dao.reputation.address,
    reputationCount: Util.fromWei(await dao.reputation.totalSupply()),
    tokenAddress: await dao.token.address,
    tokenCount: Util.fromWei(await dao.token.totalSupply()),
    tokenName: await dao.getTokenName(),
    tokenSymbol: await dao.getTokenSymbol(),
  };

  // If we pass in an account address then we want all the details for the DAO like proposals...
  if (currentAccountAddress != null) {
    // Get all members
    const mintTokenEvents = dao.token.Mint({}, { fromBlock: 0 });
    const transferTokenEvents = dao.token.Transfer({}, { fromBlock: 0 });
    const mintReputationEvents = dao.reputation.Mint({}, { fromBlock: 0 });
    let memberAddresses: string[] = [];

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

    const members: { [ key: string ]: IAccountState } = {};
    for (let cnt = 0; cnt < memberAddresses.length; cnt++) {
      const address = memberAddresses[cnt];
      const member = { address, tokens: 0, reputation: 0, votes: {}, stakes: {} };
      const tokens = await dao.token.balanceOf.call(address);
      member.tokens = Util.fromWei(tokens);
      const reputation = await dao.reputation.reputationOf.call(address);
      member.reputation = Util.fromWei(reputation);
      members[address] = member;
    }

    // If the current account is not a "member" of this DAO populate an empty account object
    if (!members[currentAccountAddress]) {
      members[currentAccountAddress] = { reputation: 0, tokens: 0, votes: {}, stakes: {}};
    }

    daoData.members = members;

    //**** Get all proposals ****//
    const contributionRewardInstance = await Arc.ContributionReward.deployed();

    // Get the voting machine (GenesisProtocol) TODO: update as Arc.js supports a better way to do this
    const schemeParamsHash = await dao.controller.getSchemeParameters(contributionRewardInstance.contract.address, dao.avatar.address);
    const schemeParams = await contributionRewardInstance.contract.parameters(schemeParamsHash);
    const votingMachineAddress = schemeParams[2];
    const votingMachineInstance = await Arc.GenesisProtocol.at(votingMachineAddress);

    const proposals = await contributionRewardInstance.getDaoProposals({ avatar: dao.avatar.address});

    // Get all proposals' details like title and description from the server
    let serverProposals: { [ key: string ]: any } = {};
    try {
      const results = await axios.get(arcConstants.API_URL + '/api/proposals?filter={"where":{"daoAvatarAddress":"' + avatarAddress + '"}}');
      serverProposals = _.keyBy(results.data, "arcId");
    } catch (e) {
      console.log(e);
    }

    let contributionProposal: Arc.ContributionProposal, genesisProposal: any, proposalId: string, description: string, title: string;
    for (let cnt = 0; cnt < proposals.length; cnt++) {
      contributionProposal = proposals[cnt];
      proposalId = contributionProposal.proposalId;

      // Default to showing the description hash if we don't have better description on the server
      description = contributionProposal.contributionDescriptionHash;
      title = "[no title]";
      if (serverProposals[proposalId]) {
        description = serverProposals[proposalId].description;
        title = serverProposals[proposalId].title;
      }

      // Get more proposal details from the GenesisProtocol voting machine
      const proposalDetails = await votingMachineInstance.contract.proposals(proposalId);
      const state = Number(proposalDetails[9]);

      const yesVotes = await votingMachineInstance.getVoteStatus({ proposalId, vote: VoteOptions.Yes });
      const noVotes = await votingMachineInstance.getVoteStatus({ proposalId, vote: VoteOptions.No });

      const yesStakes = await votingMachineInstance.getVoteStake({ proposalId, vote: VoteOptions.Yes });
      const noStakes = await votingMachineInstance.getVoteStake({ proposalId, vote: VoteOptions.No });

      // Check if current account voted on this proposal
      const voterInfo = await votingMachineInstance.getVoterInfo({ proposalId, voter: currentAccountAddress });
      daoData.members[currentAccountAddress].votes[proposalId] = {
        avatarAddress,
        proposalId,
        reputation: Util.fromWei(voterInfo.reputation),
        transactionState: TransactionStates.Confirmed,
        vote: voterInfo.vote,
        voterAddress: currentAccountAddress,
      };

      // Check if current account staked on this proposal
      const stakerInfo = await votingMachineInstance.getStakerInfo({ proposalId, staker: currentAccountAddress });
      daoData.members[currentAccountAddress].stakes[proposalId] = {
        avatarAddress,
        proposalId,
        stake: Util.fromWei(stakerInfo.stake),
        prediction: stakerInfo.vote,
        stakerAddress: currentAccountAddress,
        transactionState: TransactionStates.Confirmed,
      };

      genesisProposal = {
        boostedTime: Number(proposalDetails[10]),
        description,
        daoAvatarAddress: dao.avatar.address,
        ethReward: Util.fromWei(contributionProposal.ethReward),
        externalTokenReward: Util.fromWei(contributionProposal.externalTokenReward),
        nativeTokenReward: Util.fromWei(contributionProposal.nativeTokenReward),
        reputationChange: Util.fromWei(contributionProposal.reputationChange),
        proposer: proposalDetails[11],
        stakesNo: Util.fromWei(noStakes),
        stakesYes: Util.fromWei(yesStakes),
        state,
        submittedTime: proposalDetails[7],
        title,
        totalStakes: Util.fromWei(proposalDetails[4]),
        totalVotes: Util.fromWei(proposalDetails[3]),
        totalVoters: Number(proposalDetails[14] ? proposalDetails[14].length : 0), // TODO: this does not work
        transactionState: TransactionStates.Confirmed,
        votesYes: Util.fromWei(yesVotes),
        votesNo: Util.fromWei(noVotes),
        winningVote: Number(proposalDetails[10]),
      };

      if (state == ProposalStates.Executed) {
        // For executed proposals load the reputation at time of execution
        const eventFetcher = await votingMachineInstance.ExecuteProposal({ _proposalId: proposalId }, { fromBlock: 0 });
        await new Promise((resolve) => {
          eventFetcher.get((err, events) => {
            if (typeof err === "undefined" && events.length > 0) {
              genesisProposal.reputationWhenExecuted = Util.fromWei(events[0].args._totalReputation);
            }
            resolve();
          });
        });
      }

      const proposal = {...contributionProposal, ...genesisProposal} as IProposalState;

      daoData.proposals.push(proposal);
    } // EO for each proposal

    daoData.proposalsLoaded = true;
  } // EO get DAO details

  return daoData;
}

// TODO: there is a lot of duplicate code here with getDaoData
export function getProposal(avatarAddress: string, proposalId: string) {
  return async (dispatch: any, getState: any) => {
    dispatch({ type: arcConstants.ARC_GET_PROPOSAL_PENDING, payload: null });

    const web3 = Arc.Utils.getWeb3();
    const dao = await Arc.DAO.at(avatarAddress);
    const currentAccountAddress: string = getState().web3.ethAccountAddress;

    const contributionRewardInstance = await Arc.ContributionReward.deployed();

    // Get the voting machine (GenesisProtocol) TODO: update as Arc.js supports a better way to do this
    const schemeParamsHash = await dao.controller.getSchemeParameters(contributionRewardInstance.contract.address, dao.avatar.address);
    const schemeParams = await contributionRewardInstance.contract.parameters(schemeParamsHash);
    const votingMachineAddress = schemeParams[2];
    const votingMachineInstance = await Arc.GenesisProtocol.at(votingMachineAddress);

    const proposals = await contributionRewardInstance.getDaoProposals({ avatar: dao.avatar.address, proposalId });
    const contributionProposal = proposals[0];

    // Get title and description from the server
    // Default to showing the description hash if we don't have better description on the server
    let description = contributionProposal.contributionDescriptionHash;
    let title = "";
    try {
      const response = await axios.get(arcConstants.API_URL + '/api/proposals?filter={"where":{"daoAvatarAddress":"' + avatarAddress + '", "arcId":"' + proposalId + '"}}');
      if (response.data.length > 0) {
        description = response.data[0].description;
        title = response.data[0].title;
      }
    } catch (e) {
      console.log(e);
    }

    // Get more proposal details from the GenesisProtocol voting machine
    const proposalDetails = await votingMachineInstance.contract.proposals(proposalId);
    const state = Number(proposalDetails[9]);

    const yesVotes = await votingMachineInstance.getVoteStatus({ proposalId, vote: VoteOptions.Yes });
    const noVotes = await votingMachineInstance.getVoteStatus({ proposalId, vote: VoteOptions.No });

    const yesStakes = await votingMachineInstance.getVoteStake({ proposalId, vote: VoteOptions.Yes });
    const noStakes = await votingMachineInstance.getVoteStake({ proposalId, vote: VoteOptions.No });

    // Check if current account voted on this proposal
    const voterInfo = await votingMachineInstance.getVoterInfo({ proposalId, voter: currentAccountAddress });

    // Check if current account staked on this proposal
    const stakerInfo = await votingMachineInstance.getStakerInfo({ proposalId, staker: currentAccountAddress });

    const genesisProposal: any = {
      boostedTime: Number(proposalDetails[10]),
      description,
      daoAvatarAddress: dao.avatar.address,
      ethReward: Util.fromWei(contributionProposal.ethReward),
      externalTokenReward: Util.fromWei(contributionProposal.externalTokenReward),
      nativeTokenReward: Util.fromWei(contributionProposal.nativeTokenReward),
      reputationChange: Util.fromWei(contributionProposal.reputationChange),
      proposer: proposalDetails[11],
      stakesNo: Util.fromWei(noStakes),
      stakesYes: Util.fromWei(yesStakes),
      state,
      submittedTime: proposalDetails[7],
      title,
      totalStakes: Util.fromWei(proposalDetails[4]),
      totalVotes: Util.fromWei(proposalDetails[3]),
      totalVoters: Number(proposalDetails[14] ? proposalDetails[14].length : 0), // TODO: this does not work
      transactionState: TransactionStates.Confirmed,
      votesYes: Util.fromWei(yesVotes),
      votesNo: Util.fromWei(noVotes),
      winningVote: Number(proposalDetails[10]),
    };

    if (state == ProposalStates.Executed) {
      // For executed proposals load the reputation at time of execution
      const eventFetcher = await votingMachineInstance.ExecuteProposal({ _proposalId: proposalId }, { fromBlock: 0 });
      await new Promise((resolve) => {
        eventFetcher.get((err, events) => {
          if (typeof err === "undefined" && events.length > 0) {
            genesisProposal.reputationWhenExecuted = Util.fromWei((events[0].args as any)._totalReputation);
          }
          resolve();
        });
      });
    }

    const proposal = {...contributionProposal, ...genesisProposal} as IProposalState;
    const payload = normalize(proposal, schemas.proposalSchema);
    (payload as any).daoAvatarAddress = proposal.daoAvatarAddress;

    // TODO: only do this if the person did a vote
    (payload as any).vote = {
      avatarAddress,
      proposalId,
      reputation: Util.fromWei(voterInfo.reputation),
      transactionState: TransactionStates.Confirmed,
      vote: voterInfo.vote,
      voterAddress: currentAccountAddress,
    };
    (payload as any).stake = {
      avatarAddress,
      proposalId,
      stake: Util.fromWei(stakerInfo.stake),
      prediction: stakerInfo.vote,
      stakerAddress: currentAccountAddress,
      transactionState: TransactionStates.Confirmed,
    };

    dispatch({ type: arcConstants.ARC_GET_PROPOSAL_FULFILLED, payload });
  };
}

export function createDAO(daoName: string, tokenName: string, tokenSymbol: string, members: any): ThunkAction<any, IRootState, null> {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    dispatch({ type: arcConstants.ARC_CREATE_DAO_PENDING, payload: null });
    try {
      const web3: Web3 = Arc.Utils.getWeb3();

      let founders: Arc.FounderConfig[] = [], member;
      members.sort((a: any, b: any) => {
        b.reputation - a.reputation;
      });
      for (let i = 0; i < members.length; i++) {
        member = members[i];
        founders[i] = {
          address : member.address,
          tokens : web3.toWei(member.tokens, "ether"),
          reputation: web3.toWei(member.reputation, "ether"),
        };
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
      const daoTransaction = await daoCreator.forgeOrg({
        name: daoName,
        tokenName,
        tokenSymbol,
        founders,
      });

      const avatarAddress = daoTransaction.getValueFromTx("_avatar", "NewOrg");
      const dao = await Arc.DAO.at(avatarAddress);

      const votingMachine = await Arc.GenesisProtocol.deployed();

      const votingMachineParamsHash = (await votingMachine.setParams({
        preBoostedVoteRequiredPercentage: 50,
        preBoostedVotePeriodLimit: 5184000, // 2 months
        boostedVotePeriodLimit: 604800, // 1 week
        thresholdConstA: 2, // Threshold effects how likely it is for a propoasl to get boosted
        thresholdConstB: 10, //     based on how many proposals are already boosted
        minimumStakingFee: 0,
        quietEndingPeriod: 7200, // Two hours
        proposingRepRewardConstA: 5, // baseline rep rewarded TODO: good for now but needs more thought
        proposingRepRewardConstB: 5, // how much to weight strength of yes votes vs no votes in reward TODO: good for now but needs more thought
        stakerFeeRatioForVoters: 1, // 1 percent of staker fee given to voters
        votersReputationLossRatio: 1, // 1 percent of rep lost by voting
        votersGainRepRatioFromLostRep: 80, // percentage of how much rep correct voters get from incorrect voters who lost rep
        governanceFormulasInterface: "0x0000000000000000000000000000000000000000",
      })).result;

      const contributionReward = await Arc.ContributionReward.deployed();
      const contributionRewardParamsHash = (await contributionReward.setParams({
        orgNativeTokenFee: web3.toWei(0, "ether"),
        votingMachine: votingMachine.contract.address,
        voteParametersHash: votingMachineParamsHash,
      })).result;

      const initialSchemesSchemes = [contributionReward.contract.address, votingMachine.contract.address];
      const initialSchemesParams = [contributionRewardParamsHash, votingMachineParamsHash];
      const initialSchemesPermissions = ["0x00000001", "0x00000000"];

      // register the schemes with the dao
      const tx = await daoCreator.contract.setSchemes(
        avatarAddress,
        initialSchemesSchemes,
        initialSchemesParams,
        initialSchemesPermissions,
      );

      /* EO creating DAO */

      const daoData: IDaoState = {
        avatarAddress: dao.avatar.address,
        controllerAddress: dao.controller.address,
        name: daoName,
        members: {},
        rank: 1, // TODO
        promotedAmount: 0,
        proposals: [],
        proposalsLoaded: true,
        reputationAddress: dao.reputation.address,
        reputationCount: 0,
        tokenAddress: dao.token.address,
        tokenCount: 0,
        tokenName,
        tokenSymbol,
      };

      dispatch({ type: arcConstants.ARC_CREATE_DAO_FULFILLED, payload: normalize(daoData, schemas.daoSchema) });
      dispatch(push("/dao/" + dao.avatar.address));
    } catch (err) {
      dispatch({ type: arcConstants.ARC_CREATE_DAO_REJECTED, payload: err.message });
    }
  }; /* EO createDAO */
}

export function createProposal(daoAvatarAddress: string, title: string, description: string, nativeTokenReward: number, reputationReward: number, beneficiary: string): ThunkAction<any, IRootState, null> {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    dispatch({ type: arcConstants.ARC_CREATE_PROPOSAL_PENDING, payload: null });
    try {
      const web3: Web3 = Arc.Utils.getWeb3();

      if (!beneficiary.startsWith("0x")) { beneficiary = "0x" + beneficiary; }

      const ethAccountAddress: string = getState().web3.ethAccountAddress;
      const dao = await Arc.DAO.at(daoAvatarAddress);

      const contributionRewardInstance = await Arc.ContributionReward.deployed();

      // Get the voting machine (GenesisProtocol) TODO: there will be a better way to do this in Arc.js soon
      const schemeParamsHash = await dao.controller.getSchemeParameters(contributionRewardInstance.contract.address, dao.avatar.address);
      const schemeParams = await contributionRewardInstance.contract.parameters(schemeParamsHash);
      const votingMachineAddress = schemeParams[2];
      const votingMachineInstance = await Arc.GenesisProtocol.at(votingMachineAddress);

      const submitProposalTransaction = await contributionRewardInstance.proposeContributionReward({
        avatar: daoAvatarAddress,
        beneficiary,
        description,
        nativeTokenReward : web3.toWei(nativeTokenReward, "ether"),
        numberOfPeriods: 1,
        periodLength : 1,
        reputationChange : web3.toWei(reputationReward, "ether"),
      });

      // TODO: error checking

      const proposalId = submitProposalTransaction.proposalId;

      // Cast a Yes vote as the owner of the proposal?
      //const voteTransaction = await votingMachineInstance.vote({ proposalId: proposalId, vote: VoteOptions.Yes});

      const descriptionHash = submitProposalTransaction.getValueFromTx("_contributionDescription");
      const submittedTime = Math.round((new Date()).getTime() / 1000);

      // Save the proposal title, description and submitted time on the server
      try {
        const response = await axios.post(arcConstants.API_URL + "/api/proposals", {
          arcId: proposalId,
          daoAvatarAddress,
          descriptionHash,
          description,
          submittedAt: submittedTime,
          title,
        });
      } catch (e) {
        console.log(e);
      }

      const proposal = {
        beneficiary,
        boostedTime: 0,
        contributionDescriptionHash: descriptionHash,
        description,
        daoAvatarAddress,
        ethReward: 0, // TODO
        executionTime: 0,
        externalToken: "0",
        externalTokenReward: 0,
        nativeTokenReward,
        numberOfPeriods: 1,
        periodLength: 1,
        proposalId,
        proposer: ethAccountAddress,
        reputationChange: reputationReward,
        stakesNo: 0,
        stakesYes: 0,
        state: ProposalStates.PreBoosted, // TODO: update if we do vote
        submittedTime,
        title,
        totalStakes: 0,
        totalVotes: 0,
        totalVoters: 0,
        transactionState: TransactionStates.Unconfirmed,
        votesYes: 0,
        votesNo: 0,
        winningVote: 0,
      } as IProposalState;

      const payload = normalize(proposal, schemas.proposalSchema);
      (payload as any).daoAvatarAddress = daoAvatarAddress;

      dispatch({ type: arcConstants.ARC_CREATE_PROPOSAL_FULFILLED, payload });
      dispatch(push("/dao/" + daoAvatarAddress));
    } catch (err) {
      dispatch({ type: arcConstants.ARC_CREATE_PROPOSAL_REJECTED, payload: err.message });
    }
  };
}

export function voteOnProposal(daoAvatarAddress: string, proposalId: string, vote: number) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const web3: Web3 = Arc.Utils.getWeb3();
    const currentAccountAddress: string = getState().web3.ethAccountAddress;

    // TODO: num transactions pending...
    let payload: any = {
      vote: {
        avatarAddress : daoAvatarAddress,
        proposalId,
        transactionState: TransactionStates.Unconfirmed,
        vote,
        voterAddress: currentAccountAddress,
      },
    };

    dispatch({ type: arcConstants.ARC_VOTE_PENDING, payload });
    try {

      const daoInstance = await Arc.DAO.at(daoAvatarAddress);
      const contributionRewardInstance = await Arc.ContributionReward.deployed();

      // TODO: clean this up once Arc.js makes it easier to get the votingMachine instance for a scheme/controller combo
      const schemeParamsHash = await daoInstance.controller.getSchemeParameters(contributionRewardInstance.contract.address, daoInstance.avatar.address);
      const schemeParams = await contributionRewardInstance.contract.parameters(schemeParamsHash);
      const votingMachineAddress = schemeParams[2]; // 2 is the index of the votingMachine address for the ContributionReward scheme
      const votingMachineInstance = await Arc.GenesisProtocol.at(votingMachineAddress);

      const voteTransaction = await votingMachineInstance.vote({ proposalId, vote} );
      const yesVotes = await votingMachineInstance.getVoteStatus({ proposalId, vote: VoteOptions.Yes });
      const noVotes = await votingMachineInstance.getVoteStatus({ proposalId, vote: VoteOptions.No });

      let winningVote = 0, reputationVoted = 0, reputationWhenExecuted = 0;
      let alert = "";

      try {
        reputationVoted = Util.fromWei(voteTransaction.getValueFromTx("_reputation", "VoteProposal"));
      } catch (err) {
        // No vote happened because the proposal was e.g. past voting date
      }

      try {
        winningVote = Number(voteTransaction.getValueFromTx("_decision", "ExecuteProposal"));
        reputationWhenExecuted = Util.fromWei(voteTransaction.getValueFromTx("_totalReputation", "ExecuteProposal"));

        // Did proposal pass?
        if (winningVote == VoteOptions.Yes) {
          alert = "Proposal passed!";
        }
      } catch (err) {
        // The proposal was not executed
      }

      payload = {
        daoAvatarAddress,
        // Update the proposal
        proposal: {
          proposalId,
          reputationWhenExecuted,
          state: Number(await votingMachineInstance.getState({ proposalId })),
          votesNo: Util.fromWei(noVotes),
          votesYes: Util.fromWei(yesVotes),
          winningVote,
        },
        // Update DAO total reputation and tokens
        dao: {
          reputationCount: Util.fromWei(await daoInstance.reputation.totalSupply()),
          tokenCount: Util.fromWei(await daoInstance.token.totalSupply()),
        },
        // Update voter tokens and reputation
        voter: {
          tokens: Util.fromWei(await daoInstance.token.balanceOf.call(currentAccountAddress)),
          reputation: Util.fromWei(await daoInstance.reputation.reputationOf.call(currentAccountAddress)),
        },
        // New vote made on the proposal
        vote: {
          avatarAddress : daoAvatarAddress,
          proposalId,
          reputation: reputationVoted,
          vote,
          voterAddress: currentAccountAddress,
        },
        alert,
      };

      dispatch({ type: arcConstants.ARC_VOTE_FULFILLED, payload });
    } catch (err) {
      dispatch({ type: arcConstants.ARC_VOTE_REJECTED, payload: err.message });
    }
  };
}

export function stakeProposal(daoAvatarAddress: string, proposalId: string, prediction: number, stake: number) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const web3: Web3 = Arc.Utils.getWeb3();
    const currentAccountAddress: string = getState().web3.ethAccountAddress;

    // TODO: num transactions pending...
    let payload: any = {
      stake: {
        avatarAddress: daoAvatarAddress,
        proposalId,
        stake,
        prediction,
        stakerAddress: currentAccountAddress,
        transactionState: TransactionStates.Unconfirmed,
      },
    };

    dispatch({ type: arcConstants.ARC_STAKE_PENDING, payload });

    try {
      const daoInstance = await Arc.DAO.at(daoAvatarAddress);
      const contributionRewardInstance = await Arc.ContributionReward.deployed();

      // TODO: clean this up once Arc.js makes it easier to get the votingMachine instance for a scheme/controller combo
      const schemeParamsHash = await daoInstance.controller.getSchemeParameters(contributionRewardInstance.contract.address, daoInstance.avatar.address);
      const schemeParams = await contributionRewardInstance.contract.parameters(schemeParamsHash);
      const votingMachineAddress = schemeParams[2]; // 2 is the index of the votingMachine address for the ContributionReward scheme
      const votingMachineInstance = await Arc.GenesisProtocol.at(votingMachineAddress);

      const votingMachineParamHash = await daoInstance.controller.getSchemeParameters(votingMachineInstance.contract.address, daoInstance.avatar.address);
      const votingMachineParam = await votingMachineInstance.contract.parameters(votingMachineParamHash);
      const minimumStakingFee = votingMachineParam[6]; // 6 is the index of minimumStakingFee in the Parameters struct.

      const StandardToken = await Arc.Utils.requireContract("StandardToken");
      const stakingToken = await StandardToken.at(await votingMachineInstance.contract.stakingToken());
      const balance = await stakingToken.balanceOf(currentAccountAddress);

      const amount = web3.toWei(stake, "ether");
      if (amount < minimumStakingFee) { throw new Error(`Staked less than the minimum: ${minimumStakingFee}!`); }
      if (amount > balance) { throw new Error(`Staked more than than the balance: ${balance}!`); }

      const stakeTransaction = await votingMachineInstance.stake({ proposalId, vote : prediction, amount});

      const yesStakes = await votingMachineInstance.getVoteStake({ proposalId, vote: VoteOptions.Yes });
      const noStakes = await votingMachineInstance.getVoteStake({ proposalId, vote: VoteOptions.No });

      // TODO: also update the account with the new # of GENS available?
      // TODO: no longer need to send the stake info below because we do it in the PENDING action
      payload = {
        daoAvatarAddress,
        proposal: {
          proposalId,
          state: Number(await votingMachineInstance.getState({ proposalId })),
          stakesNo: Util.fromWei(noStakes),
          stakesYes: Util.fromWei(yesStakes),
        },
        stake: {
          avatarAddress: daoAvatarAddress,
          proposalId,
          stake,
          prediction,
          stakerAddress: currentAccountAddress,
          transactionState: TransactionStates.Unconfirmed,
        },
      };

      dispatch({ type: arcConstants.ARC_STAKE_FULFILLED, payload });
    } catch (err) {
      // TODO: update UI
      dispatch({ type: arcConstants.ARC_STAKE_REJECTED, payload: err.message });
    }
  };
}

export function confirmStake(avatarAddress: string, proposalId: string, stakerAddress: string, prediction: number, stake: number) {
  return (dispatch: any) => {
    const payload: IStakeState = {
      avatarAddress,
      proposalId,
      stake,
      prediction,
      stakerAddress,
      transactionState: TransactionStates.Confirmed,
    };
    dispatch({ type: arcConstants.ARC_STAKE_CONFIRMED, payload });
  };
}
