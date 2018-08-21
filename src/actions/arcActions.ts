import * as Arc from "@daostack/arc.js";
import axios from "axios";
import BigNumber from "bignumber.js";
import promisify = require("es6-promisify");
import * as _ from "lodash";
import * as moment from "moment";
import { denormalize, normalize } from "normalizr";
import { push } from "react-router-redux";
import * as Redux from "redux";
import { ThunkAction } from "redux-thunk";
import { Web3 } from "web3";

import * as arcConstants from "constants/arcConstants";
import Util from "lib/util";
import { IRootState } from "reducers/index";
import { checkProposalExpired,
         newAccount,
         IAccountState,
         IDaoState,
         IRedemptionState,
         IProposalState,
         IStakeState,
         IVoteState,
         proposalEnded,
         ProposalStates,
         TransactionStates,
         VoteOptions,
         anyRedemptions,
         RewardType} from "reducers/arcReducer";

import { IAsyncAction, AsyncActionSequence } from "actions/async";
import { Dispatch } from "redux";
import { ExecutionState, GenesisProtocolFactory, GenesisProtocolWrapper } from "@daostack/arc.js";
import * as schemas from "schemas";

export function loadCachedState() {
  return async (dispatch: Redux.Dispatch<any>, getState: Function) => {
    dispatch({ type: arcConstants.ARC_LOAD_CACHED_STATE_PENDING, payload: null });
    try {
      const networkName = (await Arc.Utils.getNetworkName()).toLowerCase();
      const cachedState = await axios.get('https://s3-us-west-2.amazonaws.com/' + process.env.S3_BUCKET + '/initialArcState-' + networkName + '.json');
      dispatch({ type: arcConstants.ARC_LOAD_CACHED_STATE_FULFILLED, payload: cachedState.data });
    } catch (e) {
      console.error(e);
      dispatch({ type: arcConstants.ARC_LOAD_CACHED_STATE_REJECTED, payload: e });
    }
  };
}

export function getDAOs(fromBlock = 0, toBlock = 'latest') {
  return async (dispatch: Redux.Dispatch<any>, getState: Function) => {
    dispatch({ type: arcConstants.ARC_GET_DAOS_PENDING, payload: null });
    const daoCreator = await Arc.DaoCreatorFactory.deployed();

    if (toBlock == 'latest') {
      // make sure we use same toBlock for every call to the blockchain so everything is in sync
      toBlock = await Util.getLatestBlock();
    }

    // Get the list of daos we populated on the blockchain during genesis by looking for NewOrg events
    const newOrgEventsWatcher = daoCreator.InitialSchemesSet({}, { fromBlock, toBlock });
    const getNewOrgEvents = promisify(newOrgEventsWatcher.get.bind(newOrgEventsWatcher));
    const newOrgEvents = await getNewOrgEvents();

    const daos = {} as { [key: string]: IDaoState };

    for (let index = 0; index < newOrgEvents.length; index++) {
      const event = newOrgEvents[index];
      const daoData = await getDAOData(event.args._avatar, null, fromBlock, toBlock);
      if (daoData) {
        daos[event.args._avatar] = daoData;
      }
    }

    const payload = normalize(daos, schemas.daoList);
    (payload as any).lastBlock = toBlock;

    dispatch({ type: arcConstants.ARC_GET_DAOS_FULFILLED, payload });
  };
}

export function getDAO(avatarAddress: string, fromBlock = 0, toBlock = 'latest') {
  return async (dispatch: any, getState: any) => {
    dispatch({ type: arcConstants.ARC_GET_DAO_PENDING, payload: null });
    const currentAccountAddress: string = getState().web3.ethAccountAddress;
    const daoData = await getDAOData(avatarAddress, currentAccountAddress, fromBlock, toBlock);
    if (daoData) {
      dispatch({ type: arcConstants.ARC_GET_DAO_FULFILLED, payload: normalize(daoData, schemas.daoSchema) });
    } else {
      dispatch({ type: arcConstants.ARC_GET_DAO_REJECTED, payload: "Not a valid DAO" });
    }
  };
}

export async function getDAOData(avatarAddress: string, currentAccountAddress: string = null, fromBlock = 0, toBlock = 'latest') {
  const web3 = await Arc.Utils.getWeb3();
  const daoInstance = await Arc.DAO.at(avatarAddress);
  const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
  const votingMachineAddress = await contributionRewardInstance.getVotingMachineAddress(avatarAddress);
  if (votingMachineAddress == "0x0000000000000000000000000000000000000000") {
    // This DAO has no GenesisProtocol, so lets ignore it
    return false;
  }

  const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);
  if (!votingMachineInstance) {
    // This DAO has no GenesisProtocol, so lets ignore it
    return false;
  }

  const deployedWrapperWant = Arc.WrapperService.wrappers.GenesisProtocol;
  const byteCodeWant = await promisify((callback: any): void => web3.eth.getCode(deployedWrapperWant.address, callback))();
  const byteCodeFound = await promisify((callback: any): void => web3.eth.getCode(votingMachineInstance.address, callback))();
  if (byteCodeWant !== byteCodeFound) {
    // The voting machine found is not GenesisProtocol, so ignore this DAO
    return false;
  }

  const getBalance = promisify(web3.eth.getBalance);

  const daoData: IDaoState = {
    avatarAddress,
    controllerAddress: "",
    currentThresholdToBoost: Util.fromWei(await votingMachineInstance.getThreshold({ avatar: avatarAddress })),
    ethCount: Util.fromWei(await getBalance(avatarAddress)),
    genCount: Util.fromWei((await votingMachineInstance.getTokenBalances({avatarAddress})).stakingTokenBalance),
    lastBlock: toBlock,
    name: await daoInstance.getName(),
    members: [],
    rank: 1, // TODO
    promotedAmount: 0,
    proposals: [],
    proposalsLoaded: false,
    reputationAddress: await daoInstance.reputation.address,
    reputationCount: Util.fromWei(await daoInstance.reputation.contract.totalSupply()), // TODO: replace with wrapper function when available.
    tokenAddress: await daoInstance.token.address,
    tokenCount: Util.fromWei(await daoInstance.token.getBalanceOf(avatarAddress)),
    tokenName: await daoInstance.getTokenName(),
    tokenSupply: Util.fromWei(await daoInstance.token.getTotalSupply()),
    tokenSymbol: await daoInstance.getTokenSymbol()
  };

  // Get all "members" by seeing who has reputation in this DAO
  let memberAddresses: string[] = [];

  const mintReputationEvents = daoInstance.reputation.Mint({}, { fromBlock, toBlock });
  const getMintReputationEvents = promisify(mintReputationEvents.get.bind(mintReputationEvents));
  let eventsArray = await getMintReputationEvents();
  for (let cnt = 0; cnt < eventsArray.length; cnt++) {
    memberAddresses.push(eventsArray[cnt].args._to.toLowerCase());
  }

  // Make sure current logged in account is added, even if they have no reputation right now
  if (currentAccountAddress) {
    memberAddresses.push(currentAccountAddress);
  }

  memberAddresses = [...new Set(memberAddresses)]; // Dedupe
  const members: { [address: string]: IAccountState } = {};
  for (let cnt = 0; cnt < memberAddresses.length; cnt++) {
    const address = memberAddresses[cnt];
    const member: IAccountState = newAccount(avatarAddress, address);
    const tokens = await daoInstance.token.getBalanceOf(address);
    member.tokens = Util.fromWei(tokens);
    const reputation = await daoInstance.reputation.reputationOf(address);
    member.reputation = Util.fromWei(reputation);
    members[address] = member;
  }

  //**** Get all proposals ****//
  const votableProposals = await (await contributionRewardInstance.getVotableProposals(daoInstance.avatar.address))({}, { fromBlock, toBlock }).get();
  const executedProposals = await (await contributionRewardInstance.getExecutedProposals(daoInstance.avatar.address))({}, { fromBlock, toBlock }).get();
  const proposals = [...votableProposals, ...executedProposals];

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
    proposal = await getProposalDetails(daoInstance, votingMachineInstance, contributionRewardInstance, contributionProposal, serverProposal, currentAccountAddress, fromBlock, toBlock);
    daoData.proposals.push(proposal);

    // Add any votes, stakes and redemptions on the proposal to each account too
    // This seems weird, but best I could come up with for now
    proposal.redemptions.forEach((redemption: IRedemptionState) => {
      // If this account is not a current "member" of the DAO then add it to the list because they still have some pending redemptions
      if (!members[redemption.accountAddress]) {
        members[redemption.accountAddress] = newAccount(avatarAddress, redemption.accountAddress)
      }
      members[redemption.accountAddress].redemptions.push(redemption);
    });
    proposal.stakes.forEach((stake: IStakeState) => {
      // If this account is not a current "member" of the DAO then add it to the list to track their stakes
      if (!members[stake.stakerAddress]) {
        members[stake.stakerAddress] = newAccount(avatarAddress, stake.stakerAddress);
      }
      members[stake.stakerAddress].stakes.push(stake);
    });
    proposal.votes.forEach((vote: IVoteState) => {
      // If this account is not a current "member" of the DAO then add it to the list to track their votes
      if (!members[vote.voterAddress]) {
        members[vote.voterAddress] = newAccount(avatarAddress, vote.voterAddress);
      }
      members[vote.voterAddress].votes.push(vote);
    });
  } // EO for each proposal

  daoData.members = Object.keys(members).map((address) => members[address]);

  daoData.proposalsLoaded = true;

  return daoData;
}

export function updateDAOLastBlock(avatarAddress: string, blockNumber: number) {
  return async (dispatch: any, getState: any) => {
    const dao: IDaoState = getState().arc.daos[avatarAddress];
    const { lastBlock } = dao;

    if (Number(lastBlock) != Number(blockNumber)) {
      dispatch({
        type: arcConstants.ARC_UPDATE_DAO_LAST_BLOCK,
        payload: {
          avatarAddress,
          blockNumber
        }
      });
    }
  }
}

export function getProposal(avatarAddress: string, proposalId: string, fromBlock = 0, toBlock = 'latest') {
  return async (dispatch: any, getState: any) => {
    dispatch({ type: arcConstants.ARC_GET_PROPOSAL_PENDING, payload: null });

    const web3 = await Arc.Utils.getWeb3();
    const dao = await Arc.DAO.at(avatarAddress);
    const currentAccountAddress: string = getState().web3.ethAccountAddress;

    const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();

    const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(avatarAddress)).votingMachineAddress;
    const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);

    const votableProposals = await (await contributionRewardInstance.getVotableProposals(dao.avatar.address))({proposalId}, { fromBlock, toBlock }).get();
    const executedProposals = await (await contributionRewardInstance.getExecutedProposals(dao.avatar.address))({proposalId}, { fromBlock, toBlock }).get();
    const proposals = [...votableProposals, ...executedProposals];

    const contributionProposal = proposals[0];

    let serverProposal: any = false;
    try {
      let response = await axios.get(process.env.API_URL + '/api/proposals?filter={"where":{"and":[{"daoAvatarAddress":"' + avatarAddress + '"}, {"arcId":"' + proposalId + '"}]}}');
      if (response.data.length > 0) {
        serverProposal = response.data[0];
      }
    } catch (e) {
      console.error(e);
    }

    const proposal = await getProposalDetails(dao, votingMachineInstance, contributionRewardInstance, contributionProposal, serverProposal, currentAccountAddress, fromBlock, toBlock);
    const payload = normalize(proposal, schemas.proposalSchema);
    // TODO: Add votes and stakes and redemptions to accounts too, or maybe just get rid of this function because we load everything up front?

    dispatch({ type: arcConstants.ARC_GET_PROPOSAL_FULFILLED, payload });
  };
}

// Pull together the final propsal object from ContributionReward, the GenesisProtocol voting machine, and the server
// TODO: put in a lib/util class somewhere?
async function getProposalDetails(daoInstance: Arc.DAO, votingMachineInstance: Arc.GenesisProtocolWrapper, contributionRewardInstance: Arc.ContributionRewardWrapper, contributionProposal: Arc.ContributionProposal, serverProposal: any, currentAccountAddress: string = null, fromBlock = 0, toBlock = 'latest'): Promise<IProposalState> {
  const proposalId = contributionProposal.proposalId;
  const descriptionHash = contributionProposal.contributionDescriptionHash;
  const avatarAddress = daoInstance.avatar.address;

  const votingMachineParamsHash = await daoInstance.controller.getSchemeParameters(votingMachineInstance.contract.address, avatarAddress);
  const votingMachineParams = await votingMachineInstance.getParameters(votingMachineParamsHash);

  const proposalDetails = await votingMachineInstance.getProposal(proposalId);
  const proposalStatus = await votingMachineInstance.getProposalStatus({ proposalId });

  const submittedTime = Number(proposalDetails.submittedTime);

  // Use title and description from the server
  let description = "";
  let title = "[no title]";
  if (serverProposal) {
    description = serverProposal.description;
    title = serverProposal.title;
  } else {
    // If we didn't find the proposal by proposalId, see if there is one that matches by description hash that doesnt yet have a proposalId added to it
    let response = await axios.get(process.env.API_URL + '/api/proposals?filter={"where":{"and":[{"arcId":null},{"daoAvatarAddress":"' + avatarAddress + '"},{"descriptionHash":"' + descriptionHash + '"}]}}');
    if (response.data.length > 0) {
      serverProposal = response.data[0];
      description = serverProposal.description;
      title = serverProposal.title;

      // If we found one, then update the database with the proposalId
      response = await axios.patch(process.env.API_URL + '/api/proposals/' + serverProposal.id, {
        arcId: proposalId,
        daoAvatarAddress: avatarAddress,
        descriptionHash,
        description,
        submittedAt: submittedTime,
        title
      });
    }
  }

  const proposer = (await votingMachineInstance.NewProposal({_proposalId: proposalId}, {fromBlock: 0, toBlock: 'latest'}).get(undefined, -1))[0].args._proposer;

  const proposal: IProposalState = {...contributionProposal, ...{
    beneficiaryAddress: contributionProposal.beneficiaryAddress.toLowerCase(),
    boostedTime: Number(proposalDetails.boostedPhaseTime),
    boostedVotePeriodLimit: Number(proposalDetails.currentBoostedVotePeriodLimit),
    daoAvatarAddress: avatarAddress,
    description,
    ethReward: Util.fromWei(contributionProposal.ethReward),
    externalTokenReward: Util.fromWei(contributionProposal.externalTokenReward),
    executionTime: Number(contributionProposal.executionTime),
    nativeTokenReward: Util.fromWei(contributionProposal.nativeTokenReward),
    numberOfPeriods: Number(contributionProposal.numberOfPeriods),
    redemptions: [],
    reputationChange: Util.fromWei(contributionProposal.reputationChange),
    periodLength: Number(contributionProposal.periodLength),
    preBoostedVotePeriodLimit: Number(votingMachineParams.preBoostedVotePeriodLimit),
    proposer,
    stakes: [],
    stakesNo: Util.fromWei(proposalStatus.stakesNo),
    stakesYes: Util.fromWei(proposalStatus.stakesYes),
    state: Number(proposalDetails.state), // TODO: using our own enum instead of from Arc.js because we add new states, have arc.js do this?,
    submittedTime,
    title,
    transactionState: TransactionStates.Confirmed,
    votes: [],
    votesYes: Util.fromWei(await votingMachineInstance.getVoteStatus({ proposalId, vote: VoteOptions.Yes })),
    votesNo: Util.fromWei(await votingMachineInstance.getVoteStatus({ proposalId, vote: VoteOptions.No })),
    winningVote: proposalDetails.winningVote,
  }};

  delete (proposal as any).votingMachine;

  proposal.state = checkProposalExpired(proposal);

  if (proposal.state == ProposalStates.Executed) {
    // For executed proposals load the reputation at time of execution
    const executeProposalEventFetcher = await votingMachineInstance.ExecuteProposal({ _proposalId: proposalId }, { fromBlock: 0, toBlock });
    const getExecuteProposalEvents = promisify(executeProposalEventFetcher.get.bind(executeProposalEventFetcher));
    const executeProposalEvents = await getExecuteProposalEvents();
    if (executeProposalEvents.length > 0) {
      proposal.reputationWhenExecuted = Util.fromWei(executeProposalEvents[0].args._totalReputation);
    }
  }

  // Check for votes, stakes and redemptions for the current account on this proposal
  if (currentAccountAddress !== null) {
    const voterInfo = await getVoterInfo(avatarAddress, votingMachineInstance, proposalId, currentAccountAddress)
    if (voterInfo) {
      proposal.votes.push(voterInfo as IVoteState);
    }

    const stakerInfo = await getStakerInfo(avatarAddress, votingMachineInstance, proposalId, currentAccountAddress)
    if (stakerInfo) {
      proposal.stakes.push(stakerInfo as IStakeState);
    }

    if (proposalEnded(proposal)) {
      const redemptions = await getRedemptions(votingMachineInstance, contributionRewardInstance, proposal, currentAccountAddress);
      if (redemptions) {
        proposal.redemptions.push(redemptions as IRedemptionState);
      }
    }
  } else {
    // No current account so caching all data, pull all the votes and stakes and redemptions on this proposal ever
    const stakeEventWatcher = votingMachineInstance.Stake({ _proposalId: proposalId }, { fromBlock: 0, toBlock });
    await stakeEventWatcher.get((error: Error, eventsArray: Array<Arc.DecodedLogEntryEvent<Arc.StakeEventResult>>) => {
      for (let index = 0; index < eventsArray.length; index++) {
        const event = eventsArray[index];
        proposal.stakes.push({
          avatarAddress: event.args._avatar,
          proposalId: event.args._proposalId,
          stakerAddress: event.args._staker,
          stakeAmount: Number(Util.fromWei(event.args._amount)),
          prediction: Number(event.args._vote)
        });
      }
    });

    const voteEventWatcher = votingMachineInstance.VoteProposal({ _proposalId: proposalId }, { fromBlock: 0, toBlock });
    await voteEventWatcher.get((error: Error, eventsArray: Array<Arc.DecodedLogEntryEvent<Arc.VoteProposalEventResult>>) => {
      for (let index = 0; index < eventsArray.length; index++) {
        const event = eventsArray[index];
        proposal.votes.push({
          avatarAddress: event.args._avatar,
          proposalId: event.args._proposalId,
          reputation: Number(Util.fromWei(event.args._reputation)),
          voterAddress: event.args._voter,
          voteOption: Number(event.args._vote)
        });
      }
    });

    if (proposalEnded(proposal)) {
      // Find all current rewards waiting to be redeemed
      let associatedAccounts = [proposal.beneficiaryAddress, proposal.proposer];
      proposal.votes.forEach((vote: IVoteState) => {
        associatedAccounts.push(vote.voterAddress);
      });
      proposal.stakes.forEach((stake: IStakeState) => {
        associatedAccounts.push(stake.stakerAddress);
      });
      associatedAccounts = [...new Set(associatedAccounts)]; // Dedupe

      let redemptions: IRedemptionState;
      for (const accountAddress of associatedAccounts) {
        redemptions = await getRedemptions(votingMachineInstance, contributionRewardInstance, proposal, accountAddress);
        if (redemptions) {
          proposal.redemptions.push(redemptions);
        }
      }
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
      reputation: Util.fromWei(voterInfo.reputation),
      voteOption: Number(voterInfo.vote),
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
      stakeAmount: Util.fromWei(stakerInfo.stake),
      prediction: Number(stakerInfo.vote),
      stakerAddress
    }
  } else {
    return false;
  }
}

// TODO: move this to a separate Util/lib class
async function getRedemptions(votingMachineInstance: Arc.GenesisProtocolWrapper, proposalInstance: Arc.ContributionRewardWrapper, proposal: IProposalState, accountAddress: string): Promise<IRedemptionState> {
  if (!proposalEnded(proposal)) {
    return null;
  }

  const proposalId = proposal.proposalId;

  const redeemerInstance = await Arc.RedeemerFactory.deployed();
  const rewards = await redeemerInstance.redeemables({ proposalId, avatarAddress: proposal.daoAvatarAddress, beneficiaryAddress: accountAddress });

  const redemptions = {
    accountAddress,
    proposalId,
    beneficiaryEth: 0,
    beneficiaryNativeToken: 0,
    beneficiaryReputation: 0,
    proposerReputation: Util.fromWei(rewards.proposerReputationAmount),
    stakerReputation: Util.fromWei(rewards.stakerReputationAmount),
    stakerTokens: Util.fromWei(rewards.stakerTokenAmount),
    stakerBountyTokens: Util.fromWei(rewards.daoStakingBountyPotentialReward),
    voterReputation: Util.fromWei(rewards.voterReputationAmount),
    voterTokens: Util.fromWei(rewards.voterTokenAmount),
  };

  // Beneficiary rewards
  if (accountAddress === proposal.beneficiaryAddress) {
    if (proposal.state == ProposalStates.BoostedTimedOut && proposal.winningVote === VoteOptions.Yes) {
      // Boosted proposal that passed by expiring with more yes votes than no
      // have to manually calculate beneficiary rewards
      redemptions.beneficiaryEth = proposal.numberOfPeriods * proposal.ethReward;
      redemptions.beneficiaryNativeToken = proposal.numberOfPeriods * proposal.nativeTokenReward;
      redemptions.beneficiaryReputation = proposal.numberOfPeriods * proposal.reputationChange;
    } else {
      redemptions.beneficiaryEth = (await proposalInstance.contract.getPeriodsToPay(proposalId, proposal.daoAvatarAddress, RewardType.Eth)) * proposal.ethReward;
      redemptions.beneficiaryNativeToken = (await proposalInstance.contract.getPeriodsToPay(proposalId, proposal.daoAvatarAddress, RewardType.NativeToken)) * proposal.nativeTokenReward;
      redemptions.beneficiaryReputation = (await proposalInstance.contract.getPeriodsToPay(proposalId, proposal.daoAvatarAddress, RewardType.Reputation)) * proposal.reputationChange;
    }
  }

  return anyRedemptions(redemptions) ? redemptions : null;
}

async function getProposalRedemptions(proposal: IProposalState, state: IRootState): Promise<{ entities: any, redemptions: string[] }> {
  if (!proposalEnded(proposal)) {
    return { entities: {}, redemptions: [] };
  }

  const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
  const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(proposal.daoAvatarAddress)).votingMachineAddress;
  const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);

  let redemptions: IRedemptionState[] = [];
  let accountsToUpdate: { [key: string]: IAccountState } = {};

  // Gather redemptions for all people who interacted with the proposal
  // Doing this here instead of on proposal executed because we need to show redemptions for expired proposals too (TODO: does this make sense?)
  let associatedAccounts = [proposal.beneficiaryAddress, proposal.proposer];
  proposal.votes.forEach((vote: IVoteState) => {
    associatedAccounts.push(vote.voterAddress);
  });
  proposal.stakes.forEach((stake: IStakeState) => {
    associatedAccounts.push(stake.stakerAddress);
  });
  associatedAccounts = [...new Set(associatedAccounts)]; // Dedupe

  let accountRedemptions: IRedemptionState, account: IAccountState;
  for (const accountAddress of associatedAccounts) {
    accountRedemptions = await getRedemptions(votingMachineInstance, contributionRewardInstance, proposal, accountAddress);
    if (accountRedemptions) {
      redemptions.push(accountRedemptions);
      account = state.arc.accounts[`${accountAddress}-${proposal.daoAvatarAddress}`];
      if (!account) {
        account = newAccount(proposal.daoAvatarAddress, accountAddress, 0, 0, [`${proposal.proposalId}-${accountAddress}`]);
      } else if (account.redemptions.indexOf(`${proposal.proposalId}-${accountAddress}`) === -1) {
        // If existing account doesn't have this redemption yet then add it
        account.redemptions.push(`${proposal.proposalId}-${accountAddress}`);
      }
      accountsToUpdate[`${accountAddress}-${proposal.daoAvatarAddress}`] = account;
    }
  }

  const normalizedRedemptions = normalize(redemptions, schemas.redemptionList);

  // Dedupe new redemptions with the old redemptions already on the proposal
  // TODO: seems like this should be happening in the reducer?
  let redemptionsStrings: string[] = [...Object.keys(proposal.redemptions), ...normalizedRedemptions.result];
  redemptionsStrings = [...new Set(redemptionsStrings)];

  const entities = { ...normalizedRedemptions.entities, accounts: accountsToUpdate };
  return { entities, redemptions: redemptionsStrings };
}

export type CreateDAOAction = IAsyncAction<'ARC_CREATE_DAO', {}, any>;

export function createDAO(daoName: string, tokenName: string, tokenSymbol: string, members: IAccountState[]): ThunkAction<any, IRootState, null> {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    try {
      let founders: Arc.FounderConfig[] = [], member: IAccountState;
      let totalReputation = 0, totalTokens = 0;

      members.sort((a: IAccountState, b: IAccountState) => {
        return b.reputation - a.reputation;
      });

      for (let i = 0; i < members.length; i++) {
        member = members[i];
        member.address = member.address.toLowerCase();
        totalReputation += member.reputation;
        totalTokens += member.tokens;
        founders[i] = {
          address: member.address,
          tokens: Util.toWei(member.tokens),
          reputation: Util.toWei(member.reputation),
        };
      }

      dispatch({
        type: arcConstants.ARC_CREATE_DAO,
        sequence: AsyncActionSequence.Pending
      } as CreateDAOAction);

      const dao = await Arc.DAO.new({
        name: daoName,
        tokenName,
        tokenSymbol,
        founders,
        schemes: [
          // TODO: add these
          // { name: "UpgradeScheme" },
          // { name: "GlobalConstraintRegistrar" },
          { name: "SchemeRegistrar" },
          { name: "ContributionReward" },
          { name: "GenesisProtocol" }
        ],
        votingMachineParams: {
          votingMachineName: "GenesisProtocol"
        }
      });

      const votingMachineInstance = await Arc.GenesisProtocolFactory.deployed();

      const daoData: IDaoState = {
        avatarAddress: dao.avatar.address,
        controllerAddress: dao.controller.address,
        currentThresholdToBoost: Util.fromWei(await votingMachineInstance.getThreshold({ avatar: dao.avatar.address })),
        ethCount: 0,
        genCount: 0,
        lastBlock: await Util.getLatestBlock(),
        name: daoName,
        members,
        rank: 1, // TODO
        promotedAmount: 0,
        proposals: [],
        proposalsLoaded: true,
        reputationAddress: dao.reputation.address,
        reputationCount: totalReputation,
        tokenAddress: dao.token.address,
        tokenCount: 0,
        tokenSupply: totalTokens,
        tokenName,
        tokenSymbol
      };

      dispatch({
        type: arcConstants.ARC_CREATE_DAO,
        sequence: AsyncActionSequence.Success,
        payload: normalize(daoData, schemas.daoSchema)
      } as CreateDAOAction);

      dispatch(push("/dao/" + dao.avatar.address));
    } catch (err) {
      console.error(err);
      dispatch({
        type: arcConstants.ARC_CREATE_DAO,
        sequence: AsyncActionSequence.Failure,
      } as CreateDAOAction)
    }
  }; /* EO createDAO */
}

export type CreateProposalAction = IAsyncAction<'ARC_CREATE_PROPOSAL', { avatarAddress: string }, any>;

export function createProposal(daoAvatarAddress: string, title: string, description: string, nativeTokenReward: number, reputationReward: number, ethReward: number, beneficiaryAddress: string): ThunkAction<any, IRootState, null> {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const meta = {
      avatarAddress: daoAvatarAddress
    };

    try {
      const web3: Web3 = await Arc.Utils.getWeb3();

      if (!beneficiaryAddress.startsWith("0x")) { beneficiaryAddress = "0x" + beneficiaryAddress; }
      beneficiaryAddress = beneficiaryAddress.toLowerCase();

      const ethAccountAddress: string = getState().web3.ethAccountAddress;
      const dao = await Arc.DAO.at(daoAvatarAddress);

      const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();

      const descriptionHash = Arc.Utils.SHA3(description);
      const submittedTime = Math.round((new Date()).getTime() / 1000);

      // Save the proposal title, description and submitted time on the server
      try {
        const response = await axios.post(process.env.API_URL + "/api/proposals", {
          daoAvatarAddress,
          descriptionHash,
          description,
          submittedAt: submittedTime,
          title,
        });
      } catch (e) {
        console.error(e);
      }

      dispatch({
        type: arcConstants.ARC_CREATE_PROPOSAL,
        sequence: AsyncActionSequence.Pending,
        meta,
      } as CreateProposalAction);

      // Go back to home page while action create proposal operation gets carried out
      dispatch(push("/dao/" + daoAvatarAddress));

      await contributionRewardInstance.proposeContributionReward({
        title,
        avatar: daoAvatarAddress,
        beneficiaryAddress,
        description,
        ethReward: Util.toWei(ethReward),
        nativeTokenReward: Util.toWei(nativeTokenReward),
        numberOfPeriods: 1,
        periodLength: 0,
        reputationChange: Util.toWei(reputationReward),
      } as any);

    } catch (err) {
      console.error(err);
      dispatch({
        type: arcConstants.ARC_CREATE_PROPOSAL,
        sequence: AsyncActionSequence.Failure,
        meta,
      } as CreateProposalAction)
    }
  }
}

export function onProposalCreateEvent(eventResult: Arc.NewContributionProposalEventResult) {
  return async (dispatch: any, getState: () => IRootState) => {
    const proposalId = eventResult._proposalId;
    const avatarAddress = eventResult._avatar;
    const dao = await Arc.DAO.at(eventResult._avatar);
    const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
    const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(avatarAddress)).votingMachineAddress;
    const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);
    const currentAccountAddress = getState().web3.ethAccountAddress;

    let serverProposal: any = false;
    try {
      // See if this proposalId is already stored in the database, and if so load title and description data from there
      const response = await axios.get(process.env.API_URL + '/api/proposals?filter={"where":{"and":[{"daoAvatarAddress":"' + avatarAddress + '"}, {"arcId":"' + proposalId + '"}]}}');
      if (response.data.length > 0) {
        serverProposal = response.data[0];
      }
    } catch (e) {
      console.error(e);
    }

    // Translate the event results into a ContributionProposal to send to getProposalDetails
    const contributionProposal: Arc.ContributionProposal = {
      proposalId: eventResult._proposalId,
      beneficiaryAddress: eventResult._beneficiary,
      contributionDescriptionHash: eventResult._contributionDescription,
      ethReward: eventResult._rewards[1],
      executionTime: 0,
      externalToken: "0",
      externalTokenReward: eventResult._rewards[2],
      nativeTokenReward: eventResult._rewards[0],
      numberOfPeriods: 1,
      periodLength: 0,
      reputationChange: eventResult._reputationChange
    }

    const proposal = await getProposalDetails(dao, votingMachineInstance, contributionRewardInstance, contributionProposal, serverProposal, currentAccountAddress);

    const payload = normalize(proposal, schemas.proposalSchema);

    const meta = {
      avatarAddress
    };

    dispatch({
      type: arcConstants.ARC_CREATE_PROPOSAL,
      sequence: AsyncActionSequence.Success,
      meta,
      payload
    } as CreateProposalAction);
  }
}

export function executeProposal(avatarAddress: string, proposalId: string) {
  return async (dispatch: Dispatch<any>) => {
    const dao = await Arc.DAO.at(avatarAddress)
    const votingMachineInstance = (await dao.getSchemes('GenesisProtocol'))[0].wrapper as GenesisProtocolWrapper
    await votingMachineInstance.execute({proposalId});
  }
}

export function onProposalExecuted(avatarAddress: string, proposalId: string, executionState: ExecutionState, decision: VoteOptions, reputationWhenExecuted: number) {
  return async (dispatch: Dispatch<any>, getState: () => IRootState) => {
    if (executionState != ExecutionState.None) {
      const proposal = denormalize(getState().arc.proposals[proposalId], schemas.proposalSchema, getState().arc);
      if (!proposal) {
        return;
      }

      const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
      const daoInstance = await Arc.DAO.at(proposal.daoAvatarAddress);
      const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(proposal.daoAvatarAddress)).votingMachineAddress;
      const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);

      const proposalDetails = await contributionRewardInstance.getProposal(avatarAddress, proposalId);
      proposal.executionTime = Number(proposalDetails.executionTime);
      proposal.state = ProposalStates.Executed;
      proposal.reputationWhenExecuted = reputationWhenExecuted;
      proposal.winningVote = decision;

      // Have to do this because redeem sets proposer to 0, to prevent future redemptions for proposer
      proposal.proposer = (await votingMachineInstance.NewProposal({_proposalId: proposalId}, {fromBlock: 0, toBlock: 'latest'}).get(undefined, -1))[0].args._proposer;

      let { redemptions, entities } = await getProposalRedemptions(proposal, getState());
      proposal.redemptions = redemptions;

      const normalizedProposal = normalize(proposal, schemas.proposalSchema);
      entities = {...entities, ...normalizedProposal.entities };

      const daoUpdates = {
        avatarAddress,
        currentThresholdToBoost: Util.fromWei(await votingMachineInstance.getThreshold({ avatar: avatarAddress }))
      };

      return dispatch({
        type: arcConstants.ARC_ON_PROPOSAL_EXECUTED,
        payload: { entities, dao: daoUpdates }
      })
    }
  }
}

export function onProposalExpired(proposal: IProposalState) {
  return async (dispatch: Dispatch<any>, getState: () => IRootState) => {

    const expiredState = checkProposalExpired(proposal);
    if (expiredState != proposal.state) {
      proposal.state = expiredState;
    } else {
      return;
    }

    // proposal.reputationWhenExecuted = TODO: get from DAO? but this will get out of date on refresh...

    let { redemptions, entities } = await getProposalRedemptions(proposal, getState());
    proposal.redemptions = redemptions;
    const normalizedProposal = normalize(proposal, schemas.proposalSchema);
    entities = {...entities, ...normalizedProposal.entities };

    const daoInstance = await Arc.DAO.at(proposal.daoAvatarAddress);
    const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
    const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(proposal.daoAvatarAddress)).votingMachineAddress;
    const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);

    const daoUpdates = {
      avatarAddress: proposal.daoAvatarAddress,
      currentThresholdToBoost: Util.fromWei(await votingMachineInstance.getThreshold({ avatar: proposal.daoAvatarAddress }))
    };

    return dispatch({
      type: arcConstants.ARC_ON_PROPOSAL_EXPIRED,
      payload: { entities, dao: daoUpdates }
    })
  }
}

export type VoteAction = IAsyncAction<'ARC_VOTE', {
  avatarAddress: string,
  proposalId: string,
  reputation: number,
  voteOption: VoteOptions,
  voterAddress: string,
}, {
  entities: any,
  proposal: any,
  voter: any
}>

export function voteOnProposal(daoAvatarAddress: string, proposal: IProposalState, voteOption: number) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const web3: Web3 = await Arc.Utils.getWeb3();
    const currentAccountAddress = getState().web3.ethAccountAddress;
    const currentAccountReputation = getState().arc.accounts[`${currentAccountAddress}-${daoAvatarAddress}`].reputation;
    const proposalId = proposal.proposalId;

    const meta: IVoteState = {
      avatarAddress: daoAvatarAddress,
      proposalId,
      reputation: currentAccountReputation,
      voteOption,
      voterAddress: currentAccountAddress,
    };

    try {
      const daoInstance = await Arc.DAO.at(daoAvatarAddress);
      const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
      const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(daoAvatarAddress)).votingMachineAddress;
      const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);

      dispatch({
        type: arcConstants.ARC_VOTE,
        sequence: AsyncActionSequence.Pending,
        meta,
      } as VoteAction)

      await votingMachineInstance.vote({
        proposalId,
        vote: voteOption
      });

    } catch (err) {
      console.error(err);
      dispatch({
        type: arcConstants.ARC_VOTE,
        sequence: AsyncActionSequence.Failure,
        meta
      } as VoteAction)
    }
  };
}

export function onVoteEvent(avatarAddress: string, proposalId: string, voterAddress: string, voteOption: number, reputation: number) {
  return async (dispatch: any, getState: () => IRootState) => {
    const meta: IVoteState = {
      avatarAddress,
      proposalId,
      reputation,
      voteOption,
      voterAddress
    };

    const daoInstance = await Arc.DAO.at(avatarAddress);
    const proposal: IProposalState = getState().arc.proposals[proposalId];
    if (!proposal) {
      return;
    }

    const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
    const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(avatarAddress)).votingMachineAddress;
    const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);

    const proposalDetails = await votingMachineInstance.getProposal(proposalId);
    proposal.boostedTime = Number(proposalDetails.boostedPhaseTime); // update the boosted time in case we are in quiet ending period
    proposal.boostedVotePeriodLimit = Number(proposalDetails.currentBoostedVotePeriodLimit); // update boostedVotePeriodLimit in case we are in quiet ending period
    proposal.votesYes = Util.fromWei(await votingMachineInstance.getVoteStatus({ proposalId, vote: VoteOptions.Yes }));
    proposal.votesNo = Util.fromWei(await votingMachineInstance.getVoteStatus({ proposalId, vote: VoteOptions.No }));
    proposal.winningVote = await votingMachineInstance.getWinningVote({ proposalId });
    proposal.state = Number(await votingMachineInstance.getState({ proposalId }));
    proposal.state = checkProposalExpired(proposal);

    let entities = {};
    const voterRedemptions = await getRedemptions(votingMachineInstance, contributionRewardInstance, proposal, voterAddress);
    if (voterRedemptions) {
      const normalizedRedemptions = normalize(voterRedemptions, schemas.redemptionSchema);
      entities = normalizedRedemptions.entities;
      if (normalizedRedemptions.result && proposal.redemptions.indexOf(normalizedRedemptions.result) === -1) {
        proposal.redemptions.push(normalizedRedemptions.result);
      }
    }

    const payload = {
      entities,
      // Update the proposal
      proposal,
      // Update voter tokens and reputation
      voter: {
        tokens: Util.fromWei(await daoInstance.token.getBalanceOf(voterAddress)),
        reputation: Util.fromWei(await daoInstance.reputation.reputationOf(voterAddress)),
      }
    };

    dispatch({
      type: arcConstants.ARC_VOTE,
      sequence: AsyncActionSequence.Success,
      meta,
      payload
    } as VoteAction);
  }
}

export type StakeAction = IAsyncAction<'ARC_STAKE', {
  avatarAddress: string,
  proposalId: string,
  prediction: VoteOptions,
  stakeAmount: number,
  stakerAddress: string,
}, {
  dao: any,
  proposal: any
}>

export function stakeProposal(daoAvatarAddress: string, proposalId: string, prediction: number, stakeAmount: number) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const web3: Web3 = await Arc.Utils.getWeb3();
    const currentAccountAddress: string = getState().web3.ethAccountAddress;
    const proposal: IProposalState = getState().arc.proposals[proposalId];

    const meta = {
      avatarAddress: daoAvatarAddress,
      proposalId,
      stakeAmount,
      prediction,
      stakerAddress: currentAccountAddress,
    };

    // We currently requires already pre-approving a bunch of GENs to stake with, so we don't do the approve call again
    Arc.ConfigService.set("autoApproveTokenTransfers", false);

    try {
      const daoInstance = await Arc.DAO.at(daoAvatarAddress);
      const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
      const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(daoAvatarAddress)).votingMachineAddress;
      const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);

      const votingMachineParamHash = await daoInstance.controller.getSchemeParameters(votingMachineInstance.contract.address, daoInstance.avatar.address);
      const votingMachineParams = await votingMachineInstance.getParameters(votingMachineParamHash);
      const minimumStakingFee = votingMachineParams.minimumStakingFee;

      const amount = new BigNumber(Util.toWei(stakeAmount));
      if (amount.lt(minimumStakingFee)) { throw new Error(`Staked less than the minimum: ${Util.fromWei(minimumStakingFee)}!`); }

      dispatch({
        type: arcConstants.ARC_STAKE,
        sequence: AsyncActionSequence.Pending,
        meta
      } as StakeAction)

      await votingMachineInstance.stake({
        proposalId,
        vote: prediction,
        amount
      })
    } catch (err) {
      console.error(err);
      dispatch({
        type: arcConstants.ARC_STAKE,
        sequence: AsyncActionSequence.Failure,
        meta,
      } as StakeAction)
    }
  };
}

export function onStakeEvent(avatarAddress: string, proposalId: string, stakerAddress: string, prediction: number, stakeAmount: number) {
  return async (dispatch: any, getState: () => IRootState) => {
    const daoInstance = await Arc.DAO.at(avatarAddress);
    const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
    const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(avatarAddress)).votingMachineAddress;
    const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);

    const proposal: IProposalState = getState().arc.proposals[proposalId];
    if (!proposal) {
      // Seeing this on production. Shouldn't really happen but may as well check for safety. Must be from past issues with cache script?
      return;
    }

    const proposalDetails = await votingMachineInstance.getProposal(proposalId);
    const proposalStatus = await votingMachineInstance.getProposalStatus({ proposalId });
    proposal.stakesYes = Util.fromWei(proposalStatus.stakesYes);
    proposal.stakesNo = Util.fromWei(proposalStatus.stakesNo);
    proposal.boostedTime = Number(proposalDetails.boostedPhaseTime);
    proposal.state = Number(await votingMachineInstance.getState({ proposalId }));
    proposal.state = checkProposalExpired(proposal);

    const meta = {
      avatarAddress,
      proposalId,
      prediction,
      stakeAmount,
      stakerAddress
    };

    dispatch({
      type: arcConstants.ARC_STAKE,
      sequence: AsyncActionSequence.Success,
      meta,
      payload: {
        dao: {
          currentThresholdToBoost: Util.fromWei(await votingMachineInstance.getThreshold({ avatar: avatarAddress }))
        },
        proposal
      }
    } as StakeAction);
  }
}

export type RedeemAction = IAsyncAction<'ARC_REDEEM', {
  avatarAddress: string,
  proposalId: string,
  accountAddress: string,
}, {
  currentAccount: any,
  beneficiary: any,
  dao: any,
  proposal: any;
  beneficiaryRedemptions: IRedemptionState,
  currentAccountRedemptions: IRedemptionState,
}>

export function redeemProposal(daoAvatarAddress: string, proposal: IProposalState, accountAddress: string) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const redemption = getState().arc.redemptions[`${proposal.proposalId}-${accountAddress}`];
    const dao = getState().arc.daos[daoAvatarAddress];
    const web3: Web3 = await Arc.Utils.getWeb3();

    const meta = {
      avatarAddress: daoAvatarAddress,
      proposalId: proposal.proposalId,
      accountAddress,
    };

    dispatch({
      type: arcConstants.ARC_REDEEM,
      sequence: AsyncActionSequence.Pending,
      meta
    } as RedeemAction);

    try {
      const redeemerInstance = await Arc.RedeemerFactory.deployed();
      await redeemerInstance.redeem({ avatarAddress: daoAvatarAddress, beneficiaryAddress: accountAddress, proposalId: proposal.proposalId });

      // Get all the latest info about redemptions for the success event
      const daoInstance = await Arc.DAO.at(daoAvatarAddress);
      const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
      const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(daoAvatarAddress)).votingMachineAddress;
      const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);

      const proposalDetails = await contributionRewardInstance.getProposal(daoAvatarAddress, proposal.proposalId);
      const beneficiaryAddress = proposalDetails.beneficiaryAddress;

      const beneficiaryRedemptions = await getRedemptions(votingMachineInstance, contributionRewardInstance, proposal, beneficiaryAddress);

      proposal.state = Number(await votingMachineInstance.getState({ proposalId: proposal.proposalId }));
      proposal.state = checkProposalExpired(proposal);

      let payload: any = {
        // Update account of the beneficiary
        beneficiary: {
          tokens: Util.fromWei(await daoInstance.token.getBalanceOf(beneficiaryAddress)),
          reputation: Util.fromWei(await daoInstance.reputation.reputationOf(beneficiaryAddress))
        },
        // Update DAO total reputation and tokens
        //   XXX: this doesn't work with MetaMask and ganache right now, there is some weird caching going on
        dao: {
          reputationCount: Util.fromWei(await daoInstance.reputation.contract.totalSupply()), // TODO: replace with wrapper function when available.
          tokenCount: Util.fromWei(await daoInstance.token.getTotalSupply()),
        },
        proposal: {
          proposer: proposal.proposer,
          state: proposal.state
        },
        beneficiaryRedemptions
      };

      if (accountAddress !== beneficiaryAddress) {
        payload.currentAccount = {
          address: accountAddress,
          reputation: Util.fromWei(await daoInstance.reputation.reputationOf(accountAddress)),
          tokens: Util.fromWei(await daoInstance.token.getBalanceOf(accountAddress))
        }
        const currentAccountRedemptions = await getRedemptions(votingMachineInstance, contributionRewardInstance, proposal, accountAddress);
        payload.currentAccountRedemptions = currentAccountRedemptions;
      }

      dispatch({
        type: arcConstants.ARC_REDEEM,
        sequence: AsyncActionSequence.Success,
        meta,
        payload
      } as RedeemAction);

    } catch (err) {
      console.error(err);
      dispatch({
        type: arcConstants.ARC_REDEEM,
        sequence: AsyncActionSequence.Failure,
        meta,
      } as RedeemAction);
    }
  };
}

export function onRedeemReward(avatarAddress: string, proposalId: string, beneficiary: string, rewardType: RewardType, isTarget: boolean) {
  return async (dispatch: Dispatch<any>, getState: () => IRootState) => {
    dispatch({
      type: arcConstants.ARC_ON_REDEEM_REWARD,
      payload: {
        avatarAddress,
        rewardType,
        proposalId,
        beneficiary,
        isTarget
      }
    })
  }
}

export function onTransferEvent(avatarAddress: string, from: string, to: string) {
  return async (dispatch: Dispatch<any>, getState: () => IRootState) => {
    const daoInstance = await Arc.DAO.at(avatarAddress);
    const fromBalance = Util.fromWei(await daoInstance.token.getBalanceOf(from));
    const toBalance = Util.fromWei(await daoInstance.token.getBalanceOf(to));
    const totalTokens = Util.fromWei(await daoInstance.token.getTotalSupply());

    dispatch({
      type: arcConstants.ARC_ON_TRANSFER,
      payload: {
        avatarAddress,
        from,
        fromBalance,
        to,
        toBalance,
        totalTokens
      }
    })
  }
}

export function onReputationChangeEvent(avatarAddress: string, address: string) {
  return async (dispatch: Dispatch<any>, getState: () => IRootState) => {
    const daoInstance = await Arc.DAO.at(avatarAddress);
    const reputation = Util.fromWei(await daoInstance.reputation.reputationOf(address));
    const totalReputation = Util.fromWei(await daoInstance.reputation.contract.totalSupply()); // TODO: replace with wrapper function when available.

    dispatch({
      type: arcConstants.ARC_ON_REPUTATION_CHANGE,
      payload: {
        avatarAddress,
        address,
        reputation,
        totalReputation
      }
    })
  }
}

export function onDAOEthBalanceChanged(avatarAddress: string, balance: Number) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const dao = getState().arc.daos[avatarAddress];
    if (!dao) {
      return;
    }

    const { ethCount } = dao;

    if (ethCount != balance) {
      dispatch({
        type: arcConstants.ARC_ON_DAO_ETH_BALANCE_CHANGE,
        payload: {
          avatarAddress,
          balance
        }
      });
    }
  };
}

export function onDAOGenBalanceChanged(avatarAddress: string, balance: Number) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const dao = getState().arc.daos[avatarAddress];
    if (!dao) {
      return;
    }

    const { genCount } = dao;

    if (genCount != balance) {
      dispatch({
        type: arcConstants.ARC_ON_DAO_GEN_BALANCE_CHANGE,
        payload: {
          avatarAddress,
          balance
        }
      });
    }
  };
}
