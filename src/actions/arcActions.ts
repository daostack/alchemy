import * as Arc from "@daostack/arc.js";
import axios from "axios";
import BigNumber from "bignumber.js";
import promisify = require("es6-promisify");
import * as _ from "lodash";
import { denormalize, normalize } from "normalizr";
import { push } from "react-router-redux";
import * as Redux from "redux";
import { ThunkAction } from "redux-thunk";
import { Web3 } from "web3";

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
         proposalEnded,
         ProposalStates,
         TransactionStates,
         VoteOptions } from "reducers/arcReducer";

import { IAsyncAction, AsyncActionSequence } from "actions/async";
import { Dispatch } from "redux";
import { ExecutionState, GenesisProtocolFactory } from "@daostack/arc.js";
import { NotificationStatus, showNotification } from "reducers/notifications";
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
    const newOrgEvents = daoCreator.InitialSchemesSet({}, { fromBlock, toBlock });
    newOrgEvents.get(async (err: Error, eventsArray: any[]) => {
      if (err) {
        dispatch({ type: arcConstants.ARC_GET_DAOS_REJECTED, payload: "Error getting new daos from genesis contract: " + err.message });
      }

      const daos = {} as { [key: string]: IDaoState };

      for (let index = 0; index < eventsArray.length; index++) {
        const event = eventsArray[index];
        const daoData = await getDAOData(event.args._avatar);
        if (daoData) {
          daos[event.args._avatar] = daoData;
        }
      }

      const payload = normalize(daos, schemas.daoList);
      (payload as any).lastBlock = toBlock;

      dispatch({ type: arcConstants.ARC_GET_DAOS_FULFILLED, payload });
    });
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

  const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(avatarAddress)).votingMachineAddress;
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
    reputationCount: Util.fromWei(await daoInstance.reputation.totalSupply()),
    tokenAddress: await daoInstance.token.address,
    tokenCount: Util.fromWei(await daoInstance.token.balanceOf(avatarAddress)),
    tokenName: await daoInstance.getTokenName(),
    tokenSupply: Util.fromWei(await daoInstance.token.totalSupply()),
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
    const member: IAccountState = { ...emptyAccount, daoAvatarAddress: avatarAddress, address };
    const tokens = await daoInstance.token.balanceOf(address);
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
      if (members[redemption.accountAddress]) {
        // TODO: if accountAddress no longer has reputation in the DAO then still add here for later history purposes
        members[redemption.accountAddress].redemptions.push(redemption);
      }
    });
    proposal.stakes.forEach((stake: IStakeState) => {
      if (members[stake.stakerAddress]) {
        // TODO: if stakerAddress no longer has reputation in the DAO then still add here for later history purposes
        members[stake.stakerAddress].stakes.push(stake);
      }
    });
    proposal.votes.forEach((vote: IVoteState) => {
      if (members[vote.voterAddress]) {
        // TODO: if voterAddress no longer has reputation in the DAO then still add here for later history purposes
        members[vote.voterAddress].votes.push(vote);
      }
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

    const proposal = await getProposalDetails(dao, votingMachineInstance, contributionRewardInstance, contributionProposal, currentAccountAddress, serverProposal, fromBlock, toBlock);
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
  const votingMachineParams = await votingMachineInstance.contract.parameters(votingMachineParamsHash);

  const proposalDetails = await votingMachineInstance.contract.proposals(proposalId);
  const state = Number(proposalDetails[8]);

  const yesVotes = await votingMachineInstance.getVoteStatus({ proposalId, vote: VoteOptions.Yes });
  const noVotes = await votingMachineInstance.getVoteStatus({ proposalId, vote: VoteOptions.No });

  const yesStakes = await votingMachineInstance.getVoteStake({ proposalId, vote: VoteOptions.Yes });
  const noStakes = await votingMachineInstance.getVoteStake({ proposalId, vote: VoteOptions.No });

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
        submittedAt: Number(proposalDetails[6]),
        title
      });
    }
  }

  const proposal: IProposalState = {...contributionProposal, ...{
    beneficiaryAddress: contributionProposal.beneficiaryAddress.toLowerCase(),
    boostedTime: Number(proposalDetails[7]),
    boostedVotePeriodLimit: Number(proposalDetails[11]),
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
    preBoostedVotePeriodLimit: Number(votingMachineParams[1]),
    proposer: proposalDetails[10],
    stakes: [],
    stakesNo: Util.fromWei(noStakes),
    stakesYes: Util.fromWei(yesStakes),
    state,
    submittedTime: Number(proposalDetails[6]),
    threshold: Util.fromWei(await votingMachineInstance.getThreshold({avatar: avatarAddress, proposalId})),
    title,
    totalStakes: 0, //Util.fromWei(proposalDetails[8]),
    totalVotes: Util.fromWei(proposalDetails[3]),
    totalVoters: Number(proposalDetails[14] ? proposalDetails[14].length : 0), // TODO: this does not work
    transactionState: TransactionStates.Confirmed,
    votes: [],
    votesYes: Util.fromWei(yesVotes),
    votesNo: Util.fromWei(noVotes),
    winningVote: Number(proposalDetails[9]),
  }};

  delete (proposal as any).votingMachine;

  if (state == ProposalStates.Executed) {
    // For executed proposals load the reputation at time of execution
    const executeProposalEventFetcher = await votingMachineInstance.ExecuteProposal({ _proposalId: proposalId }, { fromBlock, toBlock });
    const getExecuteProposalEvents = promisify(executeProposalEventFetcher.get.bind(executeProposalEventFetcher));
    const executeProposalEvents = await getExecuteProposalEvents();
    if (executeProposalEvents.length > 0) {
      proposal.reputationWhenExecuted = Util.fromWei(executeProposalEvents[0].args._totalReputation);
    }
  }

  // Check for votes and stakes from the current account on this proposal
  if (currentAccountAddress !== null) {
    // Check if current account voted on this proposal
    const voterInfo = await getVoterInfo(avatarAddress, votingMachineInstance, proposalId, currentAccountAddress)
    if (voterInfo) {
      proposal.votes.push(voterInfo as IVoteState);
    }

    // Check if current account staked on this proposal
    const stakerInfo = await getStakerInfo(avatarAddress, votingMachineInstance, proposalId, currentAccountAddress)
    if (stakerInfo) {
      proposal.stakes.push(stakerInfo as IStakeState);
    }

    // If proposal closed, look for any redemptions the current account has for this proposal
    if (proposalEnded(proposal)) {
      const redemptions = await getRedemptions(avatarAddress, votingMachineInstance, contributionRewardInstance, proposal, currentAccountAddress)
      if (redemptions) {
        proposal.redemptions.push(redemptions as IRedemptionState);
      }
    }
  } else {
    // No current account so caching all data, pull all the votes and stakes and redemptions on this proposal ever
    const stakeEventWatcher = votingMachineInstance.Stake({ }, { fromBlock: 0, toBlock });
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

    const voteEventWatcher = votingMachineInstance.VoteProposal({ }, { fromBlock: 0, toBlock });
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

      let redemptions: IRedemptionState, accountAddress: string;
      for (const i of associatedAccounts) {
        accountAddress = associatedAccounts[i];
        redemptions = await getRedemptions(avatarAddress, votingMachineInstance, contributionRewardInstance, proposal, accountAddress);
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
      transactionState: TransactionStates.Confirmed,
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
      stakerAddress,
      transactionState: TransactionStates.Confirmed,
    }
  } else {
    return false;
  }
}

async function getRedemptions(avatarAddress: string, votingMachineInstance: Arc.GenesisProtocolWrapper, proposalInstance: Arc.ContributionRewardWrapper, proposal: IProposalState, accountAddress: string): Promise<IRedemptionState> {
  if (!proposalEnded(proposal)) {
    return null;
  }

  const proposalId = proposal.proposalId;

  const stakerBountyTokens = Util.fromWei(await votingMachineInstance.getRedeemableTokensStakerBounty({ proposalId, beneficiaryAddress: accountAddress }));

  const redemptions = {
    accountAddress,
    proposalId,
    beneficiaryEth: 0,
    beneficiaryNativeToken: 0,
    beneficiaryReputation: 0,
    proposerReputation: 0,
    stakerReputation: Util.fromWei(await votingMachineInstance.getRedeemableReputationStaker({ proposalId, beneficiaryAddress: accountAddress })),
    stakerTokens: Util.fromWei(await votingMachineInstance.getRedeemableTokensStaker({ proposalId, beneficiaryAddress: accountAddress })),
    stakerBountyTokens,
    voterReputation: Util.fromWei(await votingMachineInstance.getRedeemableReputationVoter({ proposalId, beneficiaryAddress: accountAddress })),
    voterTokens: Util.fromWei(await votingMachineInstance.getRedeemableTokensVoter({ proposalId, beneficiaryAddress: accountAddress })),
  };

  proposal.numberOfPeriods

  // Beneficiary rewards
  if (proposal.beneficiaryAddress == accountAddress) {
    if (proposal.state == ProposalStates.Boosted && proposal.winningVote === VoteOptions.Yes) {
      // Boosted proposal that passed by expiring with more yes votes than no
      //   have to manually calculate beneficiary rewards
      redemptions.beneficiaryEth = proposal.numberOfPeriods * proposal.ethReward;
      redemptions.beneficiaryNativeToken = proposal.numberOfPeriods * proposal.nativeTokenReward;
      redemptions.beneficiaryReputation = proposal.numberOfPeriods * proposal.reputationChange;
    } else {
      redemptions.beneficiaryEth = (await proposalInstance.contract.getPeriodsToPay(proposalId, avatarAddress, ContributionRewardType.Eth)) * proposal.ethReward;
      redemptions.beneficiaryNativeToken = (await proposalInstance.contract.getPeriodsToPay(proposalId, avatarAddress, ContributionRewardType.NativeToken)) * proposal.nativeTokenReward;
      redemptions.beneficiaryReputation = (await proposalInstance.contract.getPeriodsToPay(proposalId, avatarAddress, ContributionRewardType.Reputation)) * proposal.reputationChange;
    }
  }
  if (proposal.proposer == accountAddress) {
    redemptions.proposerReputation = Util.fromWei(await votingMachineInstance.getRedeemableReputationProposer({ proposalId }));
  }

  const anyRedemptions = (
    redemptions.beneficiaryEth ||
    redemptions.beneficiaryReputation ||
    redemptions.beneficiaryNativeToken ||
    redemptions.proposerReputation ||
    redemptions.stakerReputation ||
    redemptions.stakerTokens ||
    redemptions.stakerBountyTokens ||
    redemptions.voterReputation ||
    redemptions.voterTokens
  );
  return anyRedemptions ? redemptions : null;
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
          // { name: "SchemeRegistrar" },
          // { name: "UpgradeScheme" },
          // { name: "GlobalConstraintRegistrar" },
          { name: "ContributionReward" },
          { name: "GenesisProtocol" }
        ],
        votingMachineParams: {
          votingMachineName: "GenesisProtocol"
        }
      })

      const daoData: IDaoState = {
        avatarAddress: dao.avatar.address,
        controllerAddress: dao.controller.address,
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

      const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(daoAvatarAddress)).votingMachineAddress;
      const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);
      const votingMachineParamsHash = await dao.controller.getSchemeParameters(votingMachineInstance.contract.address, dao.avatar.address)
      const votingMachineParams = await votingMachineInstance.contract.parameters(votingMachineParamsHash)

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

    const proposal = await getProposalDetails(dao, votingMachineInstance, contributionRewardInstance, contributionProposal, serverProposal);

    const payload = normalize(proposal, schemas.proposalSchema);
    (payload as any).daoAvatarAddress = avatarAddress;

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

export function onProposalExecuted(avatarAddress: string, proposalId: string, executionState: ExecutionState, decision: VoteOptions, reputationWhenExecuted: number) {
  return async (dispatch: Dispatch<any>, getState: () => IRootState) => {
    const proposal = getState().arc.proposals[proposalId];
    // TODO: get redemptions for all? or have we already done this on the vote event?
    dispatch({
      type: arcConstants.ARC_ON_PROPOSAL_EXECUTED,
      payload: {
        avatarAddress,
        proposalId,
        executionState,
        decision,
        reputationWhenExecuted
      }
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
  dao: any,
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
    const daoInstance = await Arc.DAO.at(avatarAddress);
    const proposal: IProposalState = denormalize(getState().arc.proposals[proposalId], schemas.proposalSchema, getState().arc);
    const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();

    const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(avatarAddress)).votingMachineAddress;
    const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);

    const yesVotes = await votingMachineInstance.getVoteStatus({ proposalId, vote: VoteOptions.Yes });
    const noVotes = await votingMachineInstance.getVoteStatus({ proposalId, vote: VoteOptions.No });

    const winningVote = await votingMachineInstance.getWinningVote({ proposalId });

    const meta = {
      avatarAddress,
      proposalId,
      reputation,
      voteOption,
      voterAddress
    };

    let redemptions: IRedemptionState[] = [];
    let accountsToUpdate: { [key: string]: IAccountState } = {};
    if (proposalEnded(proposal)) {
      if (getState().web3.ethAccountAddress) {
        // Logged in to the app so only pull redemptions for currentAccount
        const currentAccountAddress: string = getState().web3.ethAccountAddress;
        const currentRedemptions = await getRedemptions(avatarAddress, votingMachineInstance, contributionRewardInstance, proposal, currentAccountAddress);
        redemptions.push(currentRedemptions);
        accountsToUpdate[`${currentAccountAddress}-${avatarAddress}`] = getState().arc.accounts[`${currentAccountAddress}-${avatarAddress}`];
        accountsToUpdate[`${currentAccountAddress}-${avatarAddress}`].redemptions.push(`${proposalId}-${currentAccountAddress}`);
      } else {
        // Caching in the background so pull redemptions for all people who interacted with the proposal
        let associatedAccounts = [proposal.beneficiaryAddress, proposal.proposer];
        proposal.votes.forEach((vote: IVoteState) => {
          associatedAccounts.push(vote.voterAddress);
        });
        proposal.stakes.forEach((stake: IStakeState) => {
          associatedAccounts.push(stake.stakerAddress);
        });
        associatedAccounts = [...new Set(associatedAccounts)]; // Dedupe

        let accountRedemptions: IRedemptionState, accountAddress: string;
        for (const i of associatedAccounts) {
          accountAddress = associatedAccounts[i];
          accountRedemptions = await getRedemptions(avatarAddress, votingMachineInstance, contributionRewardInstance, proposal, accountAddress);
          if (accountRedemptions) {
            redemptions.push(accountRedemptions);
            accountsToUpdate[`${accountAddress}-${avatarAddress}`] = getState().arc.accounts[`${accountAddress}-${avatarAddress}`];
            accountsToUpdate[`${accountAddress}-${avatarAddress}`].redemptions.push(`${proposalId}-${accountAddress}`);
          }
        }
      }
    }

    const normalizedRedemptions = normalize(redemptions, schemas.redemptionList);

    const payload = {
      entities: { ...normalizedRedemptions.entities, accounts: accountsToUpdate},
      // Update DAO total reputation and tokens
      dao: {
        reputationCount: Util.fromWei(await daoInstance.reputation.totalSupply()),
        tokenCount: Util.fromWei(await daoInstance.token.totalSupply()),
      },
      // Update the proposal
      proposal: {
        proposalId,
        redemptions: normalizedRedemptions.result,
        state: Number(await votingMachineInstance.getState({ proposalId })),
        votesNo: Util.fromWei(noVotes),
        votesYes: Util.fromWei(yesVotes),
        winningVote
      },
      // Update voter tokens and reputation
      voter: {
        tokens: Util.fromWei(await daoInstance.token.balanceOf(voterAddress)),
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
      const votingMachineParam = await votingMachineInstance.contract.parameters(votingMachineParamHash);
      const minimumStakingFee = votingMachineParam[5]; // 5 is the index of minimumStakingFee in the Parameters struct.

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

    const proposalDetails = await votingMachineInstance.contract.proposals(proposalId);
    const state = await votingMachineInstance.getState({ proposalId });

    const yesStakes = await votingMachineInstance.getVoteStake({ proposalId, vote: VoteOptions.Yes });
    const noStakes = await votingMachineInstance.getVoteStake({ proposalId, vote: VoteOptions.No });

    const meta = {
      avatarAddress,
      proposalId,
      prediction,
      stakeAmount,
      stakerAddress
    };

    const stake: IStakeState = {
      avatarAddress,
      proposalId,
      stakeAmount,
      prediction,
      stakerAddress,
      transactionState: TransactionStates.Confirmed
    };

    const payload = {
      proposal: {
        proposalId,
        state,
        boostedTime: Number(proposalDetails[7]),
        stakesNo: Util.fromWei(noStakes),
        stakesYes: Util.fromWei(yesStakes),
      }
    };

    dispatch({
      type: arcConstants.ARC_STAKE,
      sequence: AsyncActionSequence.Success,
      meta,
      payload
    } as StakeAction);
  }
}

export type RedeemAction = IAsyncAction<'ARC_REDEEM', {
  avatarAddress: string,
  proposalId: string,
  accountAddress: string,
}, {
  beneficiary: any,
  dao: any,
  redemptions: IRedemptionState
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

      const redeemRx = await redeemerInstance.redeem({ avatarAddress: daoAvatarAddress, beneficiaryAddress: accountAddress, proposalId: proposal.proposalId });
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

export function onRedeemEvent(proposalId: string) {
  return async (dispatch: any, getState: () => IRootState) => {
    const proposal = getState().arc.proposals[proposalId];
    const avatarAddress = proposal.daoAvatarAddress;
    const daoInstance = await Arc.DAO.at(avatarAddress);
    const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
    const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(avatarAddress)).votingMachineAddress;
    const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);

    const proposalDetails = await contributionRewardInstance.getProposal(avatarAddress, proposalId);
    const beneficiaryAddress = proposalDetails.beneficiaryAddress;

    const meta = {
      avatarAddress,
      proposalId,
      accountAddress: beneficiaryAddress
    }

    let payload: any = {
      // Update account of the beneficiary
      // TODO: need to do this? this will be seen by the transfer events as well
      beneficiary: {
        tokens: Util.fromWei(await daoInstance.token.balanceOf.call(beneficiaryAddress)),
        reputation: Util.fromWei(await daoInstance.reputation.reputationOf.call(beneficiaryAddress)),
      },
      // Update DAO total reputation and tokens
      //   XXX: this doesn't work with MetaMask and ganache right now, there is some weird caching going on
      dao: {
        reputationCount: Util.fromWei(await daoInstance.reputation.totalSupply()),
        tokenCount: Util.fromWei(await daoInstance.token.totalSupply()),
      },
      // Check if there are any remaining redemptions left for this proposal and this beneficiary
      redemptions: await getRedemptions(avatarAddress, votingMachineInstance, contributionRewardInstance, proposal, beneficiaryAddress)
    };

    dispatch({
      type: arcConstants.ARC_REDEEM,
      sequence: AsyncActionSequence.Success,
      meta,
      payload
    } as RedeemAction);
  };
}

export function onTransferEvent(avatarAddress: string, from: string, to: string) {
  return async (dispatch: Dispatch<any>, getState: () => IRootState) => {
    const daoInstance = await Arc.DAO.at(avatarAddress);
    const fromBalance = Util.fromWei(await daoInstance.token.balanceOf(from));
    const toBalance = Util.fromWei(await daoInstance.token.balanceOf(to));
    const totalTokens = Util.fromWei(await daoInstance.token.totalSupply());

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
    const totalReputation = Util.fromWei(await daoInstance.reputation.totalSupply());

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
