import * as Arc from "@daostack/arc.js";
import axios from "axios";
import promisify = require("es6-promisify");
import * as _ from "lodash";
import { normalize } from "normalizr";
import { push } from "react-router-redux";
import * as Redux from "redux";
import { ThunkAction } from "redux-thunk";
import * as Web3 from "web3";

import * as arcConstants from "constants/arcConstants";
import Util from "lib/util";
import { IRootState } from "reducers/index";
import { ContributionRewardType,
         emptyAccount,
         IAccountState,
         IDaoState,
         IRedemptionState,
         IProposalState,
         IStakeState,
         IVoteState,
         ProposalStates,
         TransactionStates,
         VoteOptions } from "reducers/arcReducer";

import * as schemas from "../schemas";
import BigNumber from "bignumber.js";
import { IAsyncAction, AsyncActionSequence } from "actions/async";

export function loadCachedState() {
  return async (dispatch: Redux.Dispatch<any>, getState: Function) => {
    dispatch({ type: arcConstants.ARC_LOAD_CACHED_STATE_PENDING, payload: null });
    try {
      const cachedState = await axios.get('https://s3-us-west-2.amazonaws.com/daostack-alchemy/initialArcState-' + Arc.ConfigService.get('network') + '.json');
      dispatch({ type: arcConstants.ARC_LOAD_CACHED_STATE_FULFILLED, payload: cachedState.data });
    } catch (e) {
      console.error(e);
      dispatch({ type: arcConstants.ARC_LOAD_CACHED_STATE_REJECTED, payload: e });
    }
  };
}

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
        daos[event.args._avatar] = await getDAOData(event.args._avatar, true);
      }

      dispatch({ type: arcConstants.ARC_GET_DAOS_FULFILLED, payload: normalize(daos, schemas.daoList) });
    });
  };
}

export function getDAO(avatarAddress: string) {
  return async (dispatch: any, getState: any) => {
    dispatch({ type: arcConstants.ARC_GET_DAO_PENDING, payload: null });

    const currentAccountAddress: string = getState().web3.ethAccountAddress;
    const daoData = await getDAOData(avatarAddress, true, currentAccountAddress);

    dispatch({ type: arcConstants.ARC_GET_DAO_FULFILLED, payload: normalize(daoData, schemas.daoSchema) });
  };
}

export async function getDAOData(avatarAddress: string, getDetails: boolean = false, currentAccountAddress: string = null) {
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
    reputationCount: Util.fromWei(await dao.reputation.totalSupply()).toNumber(),
    tokenAddress: await dao.token.address,
    tokenCount: Util.fromWei(await dao.token.totalSupply()).toNumber(),
    tokenName: await dao.getTokenName(),
    tokenSymbol: await dao.getTokenSymbol(),
  };

  // See if want to get all the details for the DAO like members and proposals...
  if (getDetails) {
    // Get all "members" be seeing who has ever had tokens or reputation in this DAO
    // TODO: define what we really mean by members
    // TODO: don't load fromBlock = 0 every time, store the last block we loaded in the client and only add new info since then
    let memberAddresses: string[] = [];

    const mintTokenEvents = dao.token.Mint({}, { fromBlock: 0 });
    const getMintTokenEvents = promisify(mintTokenEvents.get.bind(mintTokenEvents));
    let eventsArray = await getMintTokenEvents();
    for (let cnt = 0; cnt < eventsArray.length; cnt++) {
      memberAddresses.push(eventsArray[cnt].args.to);
    }

    const transferTokenEvents = dao.token.Transfer({}, { fromBlock: 0 });
    const getTransferTokenEvents = promisify(transferTokenEvents.get.bind(transferTokenEvents));
    eventsArray = await getTransferTokenEvents();
    for (let cnt = 0; cnt < eventsArray.length; cnt++) {
      memberAddresses.push(eventsArray[cnt].args.to);
    }

    const mintReputationEvents = dao.reputation.Mint({}, { fromBlock: 0 });
    const getMintReputationEvents = promisify(mintReputationEvents.get.bind(mintReputationEvents));
    eventsArray = await getMintReputationEvents();
    for (let cnt = 0; cnt < eventsArray.length; cnt++) {
      memberAddresses.push(eventsArray[cnt].args.to);
    }

    memberAddresses = [...new Set(memberAddresses)]; // Dedupe

    const members: { [key: string]: IAccountState } = {};
    for (let cnt = 0; cnt < memberAddresses.length; cnt++) {
      const address = memberAddresses[cnt];
      const member = { address, ...emptyAccount};
      const tokens = await dao.token.balanceOf.call(address);
      member.tokens = Util.fromWei(tokens).toNumber();
      const reputation = await dao.reputation.reputationOf.call(address);
      member.reputation = Util.fromWei(reputation).toNumber();
      members[address] = member;
    }

    daoData.members = members;

    //**** Get all proposals ****//
    const contributionRewardInstance = await Arc.ContributionReward.deployed();

    // Get the voting machine (GenesisProtocol)
    // TODO: pull the voting machine from the DAO to make sure we have the correct one
    const votingMachineInstance = await Arc.GenesisProtocol.deployed();
    const votingMachineParamsHash = await dao.controller.getSchemeParameters(votingMachineInstance.contract.address, dao.avatar.address);
    const votingMachineParams = await votingMachineInstance.contract.parameters(votingMachineParamsHash);

    const proposals = await contributionRewardInstance.getDaoProposals({ avatar: dao.avatar.address });

    // Get all proposals' details like title and description from the server
    let serverProposals: { [key: string]: any } = {};
    try {
      const results = await axios.get(process.env.API_URL + '/api/proposals?filter={"where":{"daoAvatarAddress":"' + avatarAddress + '"}}');
      serverProposals = _.keyBy(results.data, "arcId");
    } catch (e) {
      console.error(e);
    }

    let contributionProposal: Arc.ContributionProposal, proposalId: string, serverProposal: any, proposal: IProposalState, voterInfo, stakerInfo, redemptions;
    for (let cnt = 0; cnt < proposals.length; cnt++) {
      contributionProposal = proposals[cnt];
      proposalId = contributionProposal.proposalId;
      serverProposal = serverProposals[proposalId] || false;
      proposal = await getProposalDetails(dao, votingMachineInstance, contributionProposal, serverProposal, currentAccountAddress);
      daoData.proposals.push(proposal);

      // Look for votes and stakes the current account did on this proposal
      if (currentAccountAddress !== null) {
        // If the current account is not a "member" of this DAO populate an empty account object
        if (!daoData.members[currentAccountAddress]) {
          daoData.members[currentAccountAddress] = { address: currentAccountAddress, ...emptyAccount };
        }

        // Check if current account voted on this proposal
        voterInfo = await getVoterInfo(avatarAddress, votingMachineInstance, proposalId, currentAccountAddress)
        if (voterInfo) {
          daoData.members[currentAccountAddress].votes[proposalId] = voterInfo as IVoteState;
        }

        // Check if current account staked on this proposal
        stakerInfo = await getStakerInfo(avatarAddress, votingMachineInstance, proposalId, currentAccountAddress)
        if (stakerInfo) {
          daoData.members[currentAccountAddress].stakes[proposalId] = stakerInfo as IStakeState;
        }

        // If executed, look for any redemptions the current account has for this proposal
        if (proposal.state == ProposalStates.Executed) {
          redemptions = await getRedemptions(avatarAddress, votingMachineInstance, contributionRewardInstance, proposal, currentAccountAddress)
          if (redemptions) {
            daoData.members[currentAccountAddress].redemptions[proposalId] = redemptions as IRedemptionState;
          }
        }
      }
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
    const schemeParamsHash = await dao.controller.getSchemeParameters(contributionRewardInstance.contract.address, avatarAddress);
    const schemeParams = await contributionRewardInstance.contract.parameters(schemeParamsHash);
    const votingMachineAddress = schemeParams[2];
    const votingMachineInstance = await Arc.GenesisProtocol.at(votingMachineAddress);

    const proposals = await contributionRewardInstance.getDaoProposals({ avatar: dao.avatar.address, proposalId });
    const contributionProposal = proposals[0];

    let serverProposal = false;
    try {
      const response = await axios.get(process.env.API_URL + '/api/proposals?filter={"where":{"daoAvatarAddress":"' + avatarAddress + '", "arcId":"' + proposalId + '"}}');
      if (response.data.length > 0) {
        serverProposal = response.data[0];
      }
    } catch (e) {
      console.error(e);
    }

    const proposal = await getProposalDetails(dao, votingMachineInstance, contributionProposal, serverProposal, currentAccountAddress);
    const payload = normalize(proposal, schemas.proposalSchema);
    (payload as any).daoAvatarAddress = proposal.daoAvatarAddress;

    // Check if current account voted on this proposal
    let voterInfo = await getVoterInfo(avatarAddress, votingMachineInstance, proposalId, currentAccountAddress);
    if (voterInfo) {
      (payload as any).vote = voterInfo;
    }

    // Check if current account staked on this proposal
    let stakerInfo = await getStakerInfo(avatarAddress, votingMachineInstance, proposalId, currentAccountAddress);
    if (stakerInfo) {
      (payload as any).stake = stakerInfo;
    }

    if (proposal.state == ProposalStates.Executed) {
      const redemptions = await getRedemptions(avatarAddress, votingMachineInstance, contributionRewardInstance, proposal, currentAccountAddress);
      if (redemptions) {
        (payload as any).redemptions = redemptions;
      }
    }

    dispatch({ type: arcConstants.ARC_GET_PROPOSAL_FULFILLED, payload });
  };
}

// Pull together the final propsal object from ContributionReward, the GenesisProtocol voting machine, and the server
// TODO: put in a lib/util class somewhere?
async function getProposalDetails(dao: Arc.DAO, votingMachineInstance: Arc.GenesisProtocolWrapper, contributionProposal: Arc.ContributionProposal, dbProposal: any, currentAccountAddress: string) {
  const proposalId = contributionProposal.proposalId;

  const votingMachineParamsHash = await dao.controller.getSchemeParameters(votingMachineInstance.contract.address, dao.avatar.address);
  const votingMachineParams = await votingMachineInstance.contract.parameters(votingMachineParamsHash);

  const proposalDetails = await votingMachineInstance.contract.proposals(proposalId);
  const state = Number(proposalDetails[8]);

  const yesVotes = await votingMachineInstance.getVoteStatus({ proposalId, vote: VoteOptions.Yes });
  const noVotes = await votingMachineInstance.getVoteStatus({ proposalId, vote: VoteOptions.No });

  const yesStakes = await votingMachineInstance.getVoteStake({ proposalId, vote: VoteOptions.Yes });
  const noStakes = await votingMachineInstance.getVoteStake({ proposalId, vote: VoteOptions.No });

  // Title and description from the server
  // Default to showing the description hash if we don't have better description on the server
  let description = contributionProposal.contributionDescriptionHash;
  let title = "[no title]";
  if (dbProposal) {
    description = dbProposal.description;
    title = dbProposal.title;
  }

  const proposal: IProposalState = {...contributionProposal, ...{
    beneficiaryAddress: contributionProposal.beneficiaryAddress,
    boostedTime: Number(proposalDetails[7]),
    boostedVotePeriodLimit: Number(proposalDetails[11]),
    preBoostedVotePeriodLimit: Number(votingMachineParams[1]),
    description,
    daoAvatarAddress: dao.avatar.address,
    ethReward: Util.fromWei(contributionProposal.ethReward).toNumber(),
    externalTokenReward: Util.fromWei(contributionProposal.externalTokenReward).toNumber(),
    nativeTokenReward: Util.fromWei(contributionProposal.nativeTokenReward).toNumber(),
    reputationChange: Util.fromWei(contributionProposal.reputationChange).toNumber(),
    proposer: proposalDetails[10],
    stakesNo: Util.fromWei(noStakes).toNumber(),
    stakesYes: Util.fromWei(yesStakes).toNumber(),
    state,
    submittedTime: Number(proposalDetails[6]),
    title,
    totalStakes: 0, //Util.fromWei(proposalDetails[8]),
    totalVotes: Util.fromWei(proposalDetails[3]).toNumber(),
    totalVoters: Number(proposalDetails[14] ? proposalDetails[14].length : 0), // TODO: this does not work
    transactionState: TransactionStates.Confirmed,
    votesYes: Util.fromWei(yesVotes).toNumber(),
    votesNo: Util.fromWei(noVotes).toNumber(),
    winningVote: Number(proposalDetails[9]),
  }};

  if (state == ProposalStates.Executed) {
    // For executed proposals load the reputation at time of execution
    const executeProposalEventFetcher = await votingMachineInstance.ExecuteProposal({ _proposalId: proposalId }, { fromBlock: 0 });
    const getExecuteProposalEvents = promisify(executeProposalEventFetcher.get.bind(executeProposalEventFetcher));
    const executeProposalEvents = await getExecuteProposalEvents();
    if (executeProposalEvents.length > 0) {
      proposal.reputationWhenExecuted = Util.fromWei(executeProposalEvents[0].args._totalReputation).toNumber();
    }
  }

  return proposal;
}

// Get info on whether an account voted on a proposal. // TODO: move to a lib/util file?
async function getVoterInfo(avatarAddress: string, votingMachineInstance: Arc.GenesisProtocolWrapper, proposalId: string, voterAddress: string): Promise<IVoteState | boolean>  {
  const voterInfo = await votingMachineInstance.getVoterInfo({ proposalId, voter: voterAddress });
  if (Util.fromWei(voterInfo.reputation)) {
    return {
      avatarAddress,
      proposalId,
      reputation: Util.fromWei(voterInfo.reputation).toNumber(),
      transactionState: TransactionStates.Confirmed,
      vote: Number(voterInfo.vote),
      voterAddress
    }
  } else {
    return false;
  }
}

// Get info on whether an account staked on a proposal. // TODO: move to a lib/util file?
async function getStakerInfo(avatarAddress: string, votingMachineInstance: Arc.GenesisProtocolWrapper, proposalId: string, stakerAddress: string): Promise<IStakeState | boolean> {
  const stakerInfo = await votingMachineInstance.getStakerInfo({ proposalId, staker: stakerAddress });
  if (Util.fromWei(stakerInfo.stake)) {
    return {
      avatarAddress,
      proposalId,
      stake: Util.fromWei(stakerInfo.stake).toNumber(),
      prediction: Number(stakerInfo.vote),
      stakerAddress,
      transactionState: TransactionStates.Confirmed,
    }
  } else {
    return false;
  }
}

async function getRedemptions(avatarAddress: string, votingMachineInstance: Arc.GenesisProtocolWrapper, proposalInstance: Arc.ContributionRewardWrapper, proposal: IProposalState, accountAddress: string): Promise<IRedemptionState | boolean> {
  const proposalId = proposal.proposalId;

  const redemptions = {
    accountAddress,
    proposalId,
    beneficiaryEth: 0,
    beneficiaryNativeToken: 0,
    beneficiaryReputation: 0,
    proposerReputation: 0,
    stakerReputation: Util.fromWei(await votingMachineInstance.getRedeemableReputationStaker({ proposalId, beneficiaryAddress: accountAddress })).toNumber(),
    stakerTokens: Util.fromWei(await votingMachineInstance.getRedeemableTokensStaker({ proposalId, beneficiaryAddress: accountAddress })).toNumber(),
    voterReputation: Util.fromWei(await votingMachineInstance.getRedeemableReputationVoter({ proposalId, beneficiaryAddress: accountAddress })).toNumber(),
    voterTokens: Util.fromWei(await votingMachineInstance.getRedeemableTokensVoter({ proposalId, beneficiaryAddress: accountAddress })).toNumber(),
  };
  if (proposal.beneficiaryAddress == accountAddress) {
    redemptions.beneficiaryEth = (await proposalInstance.contract.getPeriodsToPay(proposalId, avatarAddress, ContributionRewardType.Eth)) * proposal.ethReward;
    redemptions.beneficiaryNativeToken = (await proposalInstance.contract.getPeriodsToPay(proposalId, avatarAddress, ContributionRewardType.NativeToken)) * proposal.nativeTokenReward;
    redemptions.beneficiaryReputation = (await proposalInstance.contract.getPeriodsToPay(proposalId, avatarAddress, ContributionRewardType.Reputation)) * proposal.reputationChange;
  }
  if (proposal.proposer == accountAddress) {
    redemptions.proposerReputation = Util.fromWei(await votingMachineInstance.getRedeemableReputationProposer({ proposalId })).toNumber();
  }
  const anyRedemptions = redemptions.beneficiaryEth || redemptions.beneficiaryReputation || redemptions.beneficiaryNativeToken || redemptions.proposerReputation || redemptions.stakerReputation || redemptions.stakerTokens || redemptions.voterReputation || redemptions.voterTokens;
  return anyRedemptions ? redemptions : false;
}

export type CreateDAOAction = IAsyncAction<'ARC_CREATE_DAO', {}, any>;

export function createDAO(daoName: string, tokenName: string, tokenSymbol: string, members: any): ThunkAction<any, IRootState, null> {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    dispatch({
      type: arcConstants.ARC_CREATE_DAO,
      sequence: AsyncActionSequence.Pending,
      operation: {
        message: 'Creating new DAO...',
        totalSteps: 4,
      }
    } as CreateDAOAction);
    try {
      const web3: Web3 = Arc.Utils.getWeb3();

      let founders: Arc.FounderConfig[] = [], member;
      members.sort((a: any, b: any) => {
        b.reputation - a.reputation;
      });
      for (let i = 0; i < members.length; i++) {
        member = members[i];
        founders[i] = {
          address: member.address,
          tokens: Util.toWei(member.tokens),
          reputation: Util.toWei(member.reputation),
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

      dispatch({
        type: arcConstants.ARC_CREATE_DAO,
        sequence: AsyncActionSequence.Pending,
        operation: {
          message: 'Setting voting machine parameters...',
        }
      } as CreateDAOAction);
      const votingMachineParamsHash = (await votingMachine.setParameters({
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
        votersGainRepRatioFromLostRep: 80
      })).result;

      const contributionReward = await Arc.ContributionReward.deployed();
      dispatch({
        type: arcConstants.ARC_CREATE_DAO,
        sequence: AsyncActionSequence.Pending,
        operation: {
          message: 'Setting contribution reward scheme parameters...',
        }
      } as CreateDAOAction);
      const contributionRewardParamsHash = (await contributionReward.setParameters({
        orgNativeTokenFee: Util.toWei(0),
        votingMachineAddress: votingMachine.contract.address,
        voteParametersHash: votingMachineParamsHash,
      })).result;

      const initialSchemesSchemes = [contributionReward.contract.address, votingMachine.contract.address];
      const initialSchemesParams = [contributionRewardParamsHash, votingMachineParamsHash];
      const initialSchemesPermissions = ["0x00000001", "0x00000000"];

      dispatch({
        type: arcConstants.ARC_CREATE_DAO,
        sequence: AsyncActionSequence.Pending,
        operation: {
          message: 'Setting initial schemes...',
        }
      } as CreateDAOAction);
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

      dispatch({
        type: arcConstants.ARC_CREATE_DAO,
        sequence: AsyncActionSequence.Success,
        operation: {
          message: 'DAO Created!'
        },
        payload: normalize(daoData, schemas.daoSchema)
      } as CreateDAOAction);
      dispatch(push("/dao/" + dao.avatar.address));
    } catch (err) {
      dispatch({
        type: arcConstants.ARC_CREATE_DAO,
        sequence: AsyncActionSequence.Failure,
        operation: {
          message: `Failed to create DAO: ${err.message}`
        }
      } as CreateDAOAction);
    }
  }; /* EO createDAO */
}

export type CreateProposalAction = IAsyncAction<'ARC_CREATE_PROPOSAL', { avatarAddress: string }, any>;

export function createProposal(daoAvatarAddress: string, title: string, description: string, nativeTokenReward: number, reputationReward: number, ethReward: number, beneficiaryAddress: string): ThunkAction<any, IRootState, null> {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const meta = {
      avatarAddress: daoAvatarAddress
    };

    dispatch({
      type: arcConstants.ARC_CREATE_PROPOSAL,
      sequence: AsyncActionSequence.Pending,
      operation: {
        message: `Submitting proposal ...`,
        totalSteps: 1
      },
      meta,
    } as CreateProposalAction);
    try {
      const web3: Web3 = Arc.Utils.getWeb3();

      if (!beneficiaryAddress.startsWith("0x")) { beneficiaryAddress = "0x" + beneficiaryAddress; }

      const ethAccountAddress: string = getState().web3.ethAccountAddress;
      const dao = await Arc.DAO.at(daoAvatarAddress);

      const contributionRewardInstance = await Arc.ContributionReward.deployed();

      // Get the voting machine (GenesisProtocol) TODO: there will be a better way to do this in Arc.js soon
      const schemeParamsHash = await dao.controller.getSchemeParameters(contributionRewardInstance.contract.address, dao.avatar.address);
      const schemeParams = await contributionRewardInstance.contract.parameters(schemeParamsHash);
      const votingMachineAddress = schemeParams[2];
      const votingMachineInstance = await Arc.GenesisProtocol.at(votingMachineAddress);
      const votingMachineParamsHash = await dao.controller.getSchemeParameters(votingMachineInstance.contract.address, dao.avatar.address)
      const votingMachineParams = await votingMachineInstance.contract.parameters(votingMachineParamsHash)

      const submitProposalTransaction = await contributionRewardInstance.proposeContributionReward({
        avatar: daoAvatarAddress,
        beneficiaryAddress,
        description,
        ethReward: Util.toWei(ethReward),
        nativeTokenReward: Util.toWei(nativeTokenReward),
        numberOfPeriods: 1,
        periodLength: 1,
        reputationChange: Util.toWei(reputationReward),
      });

      // TODO: error checking

      const proposalId = submitProposalTransaction.proposalId;

      // Cast a Yes vote as the owner of the proposal?
      //const voteTransaction = await votingMachineInstance.vote({ proposalId: proposalId, vote: VoteOptions.Yes});

      const descriptionHash = submitProposalTransaction.getValueFromTx("_contributionDescription");
      const submittedTime = Math.round((new Date()).getTime() / 1000);

      // Save the proposal title, description and submitted time on the server
      try {
        const response = await axios.post(process.env.API_URL + "/api/proposals", {
          arcId: proposalId,
          daoAvatarAddress,
          descriptionHash,
          description,
          submittedAt: submittedTime,
          title,
        });
      } catch (e) {
        console.error(e);
      }

      const proposal = {
        beneficiaryAddress,
        boostedTime: 0,
        boostedVotePeriodLimit: Number(votingMachineParams[2]),
        preBoostedVotePeriodLimit: Number(votingMachineParams[1]),
        contributionDescriptionHash: descriptionHash,
        description,
        daoAvatarAddress,
        ethReward,
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

      dispatch({
        type: arcConstants.ARC_CREATE_PROPOSAL,
        sequence: AsyncActionSequence.Success,
        operation: {
          message: `Proposal submitted!`,
        },
        meta,
        payload
      } as CreateProposalAction);
      dispatch(push("/dao/" + daoAvatarAddress));
    } catch (err) {
      dispatch({
        type: arcConstants.ARC_CREATE_PROPOSAL,
        sequence: AsyncActionSequence.Failure,
        operation: {
          message: `Failed to submit proposal`,
        },
        meta,
      } as CreateProposalAction);
    }
  };
}

export type VoteAction = IAsyncAction<'ARC_VOTE', {
  avatarAddress: string,
  proposalId: string,
  vote: VoteOptions,
  voterAddress: string,
}, {
  proposal: any,
  dao: any,
  redemptions: IRedemptionState | boolean,
  voter: any,
  vote: any,
}>

export function voteOnProposal(daoAvatarAddress: string, proposal: IProposalState, vote: number) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const web3: Web3 = Arc.Utils.getWeb3();
    const currentAccountAddress: string = getState().web3.ethAccountAddress;
    const proposalId = proposal.proposalId;

    const meta = {
      avatarAddress: daoAvatarAddress,
      proposalId,
      vote,
      voterAddress: currentAccountAddress,
    };

    dispatch({
      type: arcConstants.ARC_VOTE,
      sequence: AsyncActionSequence.Pending,
      operation: {
        message: `Voting ${vote === VoteOptions.Yes ? 'Yes' : 'No'} on ${proposal.title}...`,
        totalSteps: 1,
      },
      meta,
    } as VoteAction);
    try {

      const daoInstance = await Arc.DAO.at(daoAvatarAddress);
      const contributionRewardInstance = await Arc.ContributionReward.deployed();

      // TODO: clean this up once Arc.js makes it easier to get the votingMachine instance for a scheme/controller combo
      const schemeParamsHash = await daoInstance.controller.getSchemeParameters(contributionRewardInstance.contract.address, daoInstance.avatar.address);
      const schemeParams = await contributionRewardInstance.contract.parameters(schemeParamsHash);
      const votingMachineAddress = schemeParams[2]; // 2 is the index of the votingMachine address for the ContributionReward scheme
      const votingMachineInstance = await Arc.GenesisProtocol.at(votingMachineAddress);

      const voteTransaction = await votingMachineInstance.vote({ proposalId, vote });
    } catch (err) {
      dispatch({
        type: arcConstants.ARC_VOTE,
        sequence: AsyncActionSequence.Failure,
        operation: {
          message: `Voting on "${proposal.title}" failed: ${err.message}`
        },
        meta,
      } as VoteAction);
    }
  };
}

export function onVoteEvent(avatarAddress: string, proposalId: string, voterAddress: string, vote: number, reputation: number) {
  return async (dispatch: any, getState: () => IRootState) => {
    const daoInstance = await Arc.DAO.at(avatarAddress);
    const proposal: IProposalState = getState().arc.proposals[proposalId];
    const contributionRewardInstance = await Arc.ContributionReward.deployed();
    const currentAccountAddress: string = getState().web3.ethAccountAddress;

    // TODO: clean this up once Arc.js makes it easier to get the votingMachine instance for a scheme/controller combo
    const schemeParamsHash = await daoInstance.controller.getSchemeParameters(contributionRewardInstance.contract.address, daoInstance.avatar.address);
    const schemeParams = await contributionRewardInstance.contract.parameters(schemeParamsHash);

    const votingMachineAddress = schemeParams[2]; // 2 is the index of the votingMachine address for the ContributionReward scheme
    const votingMachineInstance = await Arc.GenesisProtocol.at(votingMachineAddress);

    const yesVotes = await votingMachineInstance.getVoteStatus({ proposalId, vote: VoteOptions.Yes });
    const noVotes = await votingMachineInstance.getVoteStatus({ proposalId, vote: VoteOptions.No });

    const winningVote = await votingMachineInstance.getWinningVote({ proposalId });

    const meta = {
      avatarAddress,
      proposalId,
      vote,
      voterAddress,
    };

    let redemptions: IRedemptionState | boolean = false;
    if (winningVote == VoteOptions.Yes) {
      redemptions = await getRedemptions(avatarAddress, votingMachineInstance, contributionRewardInstance, proposal, currentAccountAddress);
    }

    const payload = {
      daoAvatarAddress: avatarAddress,
      // Update the proposal
      proposal: {
        proposalId,
        state: Number(await votingMachineInstance.getState({ proposalId })),
        votesNo: Util.fromWei(noVotes).toNumber(),
        votesYes: Util.fromWei(yesVotes).toNumber(),
        winningVote,
      },
      // Update DAO total reputation and tokens
      dao: {
        reputationCount: Util.fromWei(await daoInstance.reputation.totalSupply()).toNumber(),
        tokenCount: Util.fromWei(await daoInstance.token.totalSupply()).toNumber(),
      },
      redemptions,
      // Update voter tokens and reputation
      voter: {
        tokens: Util.fromWei(await daoInstance.token.balanceOf.call(voterAddress)).toNumber(),
        reputation: Util.fromWei(await daoInstance.reputation.reputationOf.call(voterAddress)).toNumber(),
      },
      // New vote made on the proposal
      vote: {
        avatarAddress,
        proposalId,
        reputation,
        vote,
        voterAddress,
      },
    };

    dispatch({
      type: arcConstants.ARC_VOTE,
      sequence: AsyncActionSequence.Success,
      meta,
      operation: {
        message: `Voted on "${proposal.title}" successfully!`
      },
      payload
    } as VoteAction);
  }
}

export type StakeAction = IAsyncAction<'ARC_STAKE', {
  avatarAddress: string,
  proposalId: string,
  stake: number,
  prediction: VoteOptions,
  stakerAddress: string,
}, {
  proposal: any,
  stake: any,
}>

export function stakeProposal(daoAvatarAddress: string, proposalId: string, prediction: number, stake: number) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const web3: Web3 = Arc.Utils.getWeb3();
    const currentAccountAddress: string = getState().web3.ethAccountAddress;
    const proposal: IProposalState = getState().arc.proposals[proposalId];

    const meta = {
      avatarAddress: daoAvatarAddress,
      proposalId,
      stake,
      prediction,
      stakerAddress: currentAccountAddress,
    };

    dispatch({
      type: arcConstants.ARC_STAKE,
      sequence: AsyncActionSequence.Pending,
      operation: {
        message: `Staking on "${proposal.title}" ...`,
      },
      meta
    } as StakeAction);

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
      const minimumStakingFee = votingMachineParam[5]; // 5 is the index of minimumStakingFee in the Parameters struct.

      const StandardToken = await Arc.Utils.requireContract("StandardToken");
      const stakingToken = await StandardToken.at(await votingMachineInstance.contract.stakingToken());
      const balance = await stakingToken.balanceOf(currentAccountAddress);

      const amount = new BigNumber(Util.toWei(stake));
      if (amount.lt(minimumStakingFee)) { throw new Error(`Staked less than the minimum: ${Util.fromWei(minimumStakingFee).toNumber()}!`); }
      if (amount.gt(balance)) { throw new Error(`Staked more than than the balance: ${Util.fromWei(balance).toNumber()}!`); }

      const stakeTransaction = await votingMachineInstance.stake({ proposalId, vote: prediction, amount });
    } catch (err) {
      dispatch({
        type: arcConstants.ARC_STAKE,
        sequence: AsyncActionSequence.Failure,
        meta,
        operation: {
          message: `Staking on "${proposal.title}" failed: ${err.message}`
        }
      } as StakeAction);
    }
  };
}

export function onStakeEvent(avatarAddress: string, proposalId: string, stakerAddress: string, prediction: number, stake: number) {
  return async (dispatch: any, getState: () => IRootState) => {
    const proposal: IProposalState = getState().arc.proposals[proposalId];

    const daoInstance = await Arc.DAO.at(avatarAddress);
    const contributionRewardInstance = await Arc.ContributionReward.deployed();

    // TODO: clean this up once Arc.js makes it easier to get the votingMachine instance for a scheme/controller combo
    const schemeParamsHash = await daoInstance.controller.getSchemeParameters(contributionRewardInstance.contract.address, daoInstance.avatar.address);
    const schemeParams = await contributionRewardInstance.contract.parameters(schemeParamsHash);
    const votingMachineAddress = schemeParams[2]; // 2 is the index of the votingMachine address for the ContributionReward scheme
    const votingMachineInstance = await Arc.GenesisProtocol.at(votingMachineAddress);

    const proposalDetails = await votingMachineInstance.contract.proposals(proposalId);
    const state = await votingMachineInstance.getState({ proposalId });

    const yesStakes = await votingMachineInstance.getVoteStake({ proposalId, vote: VoteOptions.Yes });
    const noStakes = await votingMachineInstance.getVoteStake({ proposalId, vote: VoteOptions.No });

    const meta = {
      avatarAddress,
      proposalId,
      stake,
      prediction,
      stakerAddress,
    }

    const payload = {
      daoAvatarAddress: avatarAddress,
      proposal: {
        proposalId,
        state,
        boostedTime: Number(proposalDetails[7]),
        stakesNo: Util.fromWei(noStakes).toNumber(),
        stakesYes: Util.fromWei(yesStakes).toNumber(),
      },
      stake: {
        avatarAddress,
        proposalId,
        stake,
        prediction,
        stakerAddress,
        transactionState: TransactionStates.Confirmed,
      },
    };

    dispatch({
      type: arcConstants.ARC_STAKE,
      sequence: AsyncActionSequence.Success,
      operation: {
        message: `Staked on "${proposal.title}" successfully!`
      },
      meta,
      payload
    } as StakeAction);
  };
}

export type RedeemAction = IAsyncAction<'ARC_REDEEM', {
  avatarAddress: string,
  proposalId: string,
  accountAddress: string,
}, {
  proposalId: string,
  beneficiary: any,
  dao: any
}>

export function redeemProposal(daoAvatarAddress: string, proposal: IProposalState, accountAddress: string) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const web3: Web3 = Arc.Utils.getWeb3();

    const meta = {
      avatarAddress: daoAvatarAddress,
      proposalId: proposal.proposalId,
      accountAddress,
    };

    dispatch({
      type: arcConstants.ARC_REDEEM,
      sequence: AsyncActionSequence.Pending,
      operation: {
        message: `Redeeming rewards for proposal "${proposal.title}" ...`,
      },
      meta
    } as RedeemAction);

    try {
      const daoInstance = await Arc.DAO.at(daoAvatarAddress);

      // TODO: should pull from the DAO
      const votingMachineInstance = await Arc.GenesisProtocol.deployed();
      const contributionRewardInstance = await Arc.ContributionReward.deployed();

      const redeemTransaction = await votingMachineInstance.redeem({ beneficiaryAddress: accountAddress, proposalId: proposal.proposalId });

      // If current user is the beneficiary then redeem the contribution rewards too
      if (proposal.beneficiaryAddress == accountAddress) {
        const rewardRedeemTransaction = await contributionRewardInstance.contract.redeem(proposal.proposalId, daoAvatarAddress, [true, true, true, true]);
      }

      let payload: any = {
        proposalId: proposal.proposalId,
        // Update account of the beneficiary
        beneficiary: {
          address: accountAddress,
          tokens: Util.fromWei(await daoInstance.token.balanceOf.call(accountAddress)).toNumber(),
          reputation: Util.fromWei(await daoInstance.reputation.reputationOf.call(accountAddress)).toNumber(),
        },
        // Update DAO total reputation and tokens
        //   XXX: this doesn't work with MetaMask and ganache right now, there is some weird caching going on
        dao: {
          avatarAddress: daoAvatarAddress,
          reputationCount: Util.fromWei(await daoInstance.reputation.totalSupply()).toNumber(),
          tokenCount: Util.fromWei(await daoInstance.token.totalSupply()).toNumber(),
        },
      };

      dispatch({
        type: arcConstants.ARC_REDEEM,
        sequence: AsyncActionSequence.Success,
        operation: {
          message: `Successfully redeemed rewards for proposal "${proposal.title}"!`
        },
        meta,
        payload
      } as RedeemAction);
    } catch (err) {
      dispatch({
        type: arcConstants.ARC_REDEEM,
        sequence: AsyncActionSequence.Failure,
        meta,
        operation: {
          message: `Error redeeming rewards for proposal "${proposal.title}": ${err.message}`
        }
      } as RedeemAction);
    }
  };
}
