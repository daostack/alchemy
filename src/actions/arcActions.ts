import * as Arc from "@daostack/arc.js";
import axios from "axios";
import promisify = require("es6-promisify");
import * as _ from "lodash";
import { normalize } from "normalizr";
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
         ProposalStates,
         TransactionStates,
         VoteOptions } from "reducers/arcReducer";

import * as schemas from "../schemas";
import BigNumber from "bignumber.js";
import { IAsyncAction, AsyncActionSequence } from "actions/async";
import { Dispatch } from "redux";
import { ExecutionState } from "@daostack/arc.js";
import { NotificationStatus, showNotification } from "reducers/operations";
import * as moment from "moment";

export function proposalEnded(proposal: IProposalState) {
  const res = (
    proposal.state == ProposalStates.Executed ||
    proposal.state == ProposalStates.Closed ||
    (proposal.state == ProposalStates.Boosted && proposal.boostedTime + proposal.boostedVotePeriodLimit <= +moment() / 1000) ||
    (proposal.state == ProposalStates.PreBoosted && proposal.submittedTime + proposal.preBoostedVotePeriodLimit <= +moment() / 1000)
  );
  return res;
}

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

export function getDAOs() {
  return async (dispatch: Redux.Dispatch<any>, getState: Function) => {
    dispatch({ type: arcConstants.ARC_GET_DAOS_PENDING, payload: null });
    const daoCreator = await Arc.DaoCreatorFactory.deployed();

    // Get the list of daos we populated on the blockchain during genesis by looking for NewOrg events
    const newOrgEvents = daoCreator.InitialSchemesSet({}, { fromBlock: 0 });
    newOrgEvents.get(async (err: Error, eventsArray: any[]) => {
      if (err) {
        dispatch({ type: arcConstants.ARC_GET_DAOS_REJECTED, payload: "Error getting new daos from genesis contract: " + err.message });
      }

      const daos = {} as { [key: string]: IDaoState };

      for (let index = 0; index < eventsArray.length; index++) {
        const event = eventsArray[index];
        const daoData = await getDAOData(event.args._avatar, true);
        if (daoData) {
          daos[event.args._avatar] = daoData;
        }
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
    if (daoData) {
      dispatch({ type: arcConstants.ARC_GET_DAO_FULFILLED, payload: normalize(daoData, schemas.daoSchema) });
    } else {
      dispatch({ type: arcConstants.ARC_GET_DAO_REJECTED, payload: "Not a valid DAO" });
    }
  };
}

export async function getDAOData(avatarAddress: string, getDetails: boolean = false, currentAccountAddress: string = null) {
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
    ethCount: Util.fromWei(await getBalance(avatarAddress)).toNumber(),
    genCount: Util.fromWei((await votingMachineInstance.getTokenBalances({avatarAddress})).stakingTokenBalance).toNumber(),
    name: await daoInstance.getName(),
    members: {},
    rank: 1, // TODO
    promotedAmount: 0,
    proposals: [],
    proposalsLoaded: false,
    reputationAddress: await daoInstance.reputation.address,
    reputationCount: Util.fromWei(await daoInstance.reputation.totalSupply()).toNumber(),
    tokenAddress: await daoInstance.token.address,
    tokenCount: Util.fromWei(await daoInstance.token.balanceOf(avatarAddress)).toNumber(),
    tokenName: await daoInstance.getTokenName(),
    tokenSupply: Util.fromWei(await daoInstance.token.totalSupply()).toNumber(),
    tokenSymbol: await daoInstance.getTokenSymbol(),
  };

  // See if want to get all the details for the DAO like members and proposals...
  if (getDetails) {
    // Get all "members" be seeing who has ever had tokens or reputation in this DAO
    // TODO: define what we really mean by members
    // TODO: don't load fromBlock = 0 every time, store the last block we loaded in the client and only add new info since then
    let memberAddresses: string[] = [];

    const mintTokenEvents = daoInstance.token.Mint({}, { fromBlock: 0 });
    const getMintTokenEvents = promisify(mintTokenEvents.get.bind(mintTokenEvents));
    let eventsArray = await getMintTokenEvents();
    for (let cnt = 0; cnt < eventsArray.length; cnt++) {
      memberAddresses.push(eventsArray[cnt].args.to.toLowerCase());
    }

    const transferTokenEvents = daoInstance.token.Transfer({}, { fromBlock: 0 });
    const getTransferTokenEvents = promisify(transferTokenEvents.get.bind(transferTokenEvents));
    eventsArray = await getTransferTokenEvents();
    for (let cnt = 0; cnt < eventsArray.length; cnt++) {
      memberAddresses.push(eventsArray[cnt].args.to.toLowerCase());
    }

    const mintReputationEvents = daoInstance.reputation.Mint({}, { fromBlock: 0 });
    const getMintReputationEvents = promisify(mintReputationEvents.get.bind(mintReputationEvents));
    eventsArray = await getMintReputationEvents();
    for (let cnt = 0; cnt < eventsArray.length; cnt++) {
      memberAddresses.push(eventsArray[cnt].args._to.toLowerCase());
    }

    memberAddresses = [...new Set(memberAddresses)]; // Dedupe

    const members: { [key: string]: IAccountState } = {};
    for (let cnt = 0; cnt < memberAddresses.length; cnt++) {
      const address = memberAddresses[cnt];
      const member = { address, ...emptyAccount};
      const tokens = await daoInstance.token.balanceOf(address);
      member.tokens = Util.fromWei(tokens).toNumber();
      const reputation = await daoInstance.reputation.reputationOf(address);
      member.reputation = Util.fromWei(reputation).toNumber();
      members[address] = member;
    }

    daoData.members = members;

    // If the current account is not a "member" of this DAO populate an empty account object
    if (currentAccountAddress !== null && !daoData.members[currentAccountAddress]) {
      daoData.members[currentAccountAddress] = { address: currentAccountAddress, ...emptyAccount };
    }

    //**** Get all proposals ****//
    const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();

    // Get the voting machine (GenesisProtocol)
    const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(avatarAddress)).votingMachineAddress;
    const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);

    const votingMachineParamsHash = await daoInstance.controller.getSchemeParameters(votingMachineInstance.contract.address, daoInstance.avatar.address);
    const votingMachineParams = await votingMachineInstance.contract.parameters(votingMachineParamsHash);

    const votableProposals = await (await contributionRewardInstance.getVotableProposals(daoInstance.avatar.address))({}, {fromBlock: 0}).get();
    const executedProposals = await (await contributionRewardInstance.getExecutedProposals(daoInstance.avatar.address))({}, {fromBlock: 0}).get();
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
      proposal = await getProposalDetails(daoInstance, votingMachineInstance, contributionProposal, serverProposal, currentAccountAddress);
      daoData.proposals.push(proposal);

      // Look for votes and stakes the current account did on this proposal
      if (currentAccountAddress !== null) {
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

        // If proposal closed, look for any redemptions the current account has for this proposal
        if (proposalEnded(proposal)) {
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

    const web3 = await Arc.Utils.getWeb3();
    const dao = await Arc.DAO.at(avatarAddress);
    const currentAccountAddress: string = getState().web3.ethAccountAddress;

    const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();

    const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(avatarAddress)).votingMachineAddress;
    const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);

    const votableProposals = await (await contributionRewardInstance.getVotableProposals(dao.avatar.address))({proposalId}, {fromBlock: 0}).get();
    const executedProposals = await (await contributionRewardInstance.getExecutedProposals(dao.avatar.address))({proposalId}, {fromBlock: 0}).get();
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

    if (proposalEnded(proposal)) {
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
async function getProposalDetails(dao: Arc.DAO, votingMachineInstance: Arc.GenesisProtocolWrapper, contributionProposal: Arc.ContributionProposal, serverProposal: any, currentAccountAddress: string): Promise<IProposalState> {
  const proposalId = contributionProposal.proposalId;
  const descriptionHash = contributionProposal.contributionDescriptionHash;

  const votingMachineParamsHash = await dao.controller.getSchemeParameters(votingMachineInstance.contract.address, dao.avatar.address);
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
    let response = await axios.get(process.env.API_URL + '/api/proposals?filter={"where":{"and":[{"arcId":null},{"daoAvatarAddress":"' + dao.avatar.address + '"},{"descriptionHash":"' + descriptionHash + '"}]}}');
    if (response.data.length > 0) {
      serverProposal = response.data[0];
      description = serverProposal.description;
      title = serverProposal.title;

      // If we found one, then update the database with the proposalId
      response = await axios.patch(process.env.API_URL + '/api/proposals/' + serverProposal.id, {
        arcId: proposalId,
        daoAvatarAddress: dao.avatar.address,
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
    threshold: Util.fromWei(await votingMachineInstance.getThreshold({avatar: dao.avatar.address, proposalId})).toNumber()
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
  if (!proposalEnded(proposal)) {
    return false;
  }

  const proposalId = proposal.proposalId;

  const stakerBountyTokens = Util.fromWei(await votingMachineInstance.getRedeemableTokensStakerBounty({ proposalId, beneficiaryAddress: accountAddress })).toNumber();

  const redemptions = {
    accountAddress,
    proposalId,
    beneficiaryEth: 0,
    beneficiaryNativeToken: 0,
    beneficiaryReputation: 0,
    proposerReputation: 0,
    stakerReputation: Util.fromWei(await votingMachineInstance.getRedeemableReputationStaker({ proposalId, beneficiaryAddress: accountAddress })).toNumber(),
    stakerTokens: Util.fromWei(await votingMachineInstance.getRedeemableTokensStaker({ proposalId, beneficiaryAddress: accountAddress })).toNumber(),
    stakerBountyTokens,
    voterReputation: Util.fromWei(await votingMachineInstance.getRedeemableReputationVoter({ proposalId, beneficiaryAddress: accountAddress })).toNumber(),
    voterTokens: Util.fromWei(await votingMachineInstance.getRedeemableTokensVoter({ proposalId, beneficiaryAddress: accountAddress })).toNumber(),
  };

  // Beneficiary rewards
  if (proposal.beneficiaryAddress == accountAddress) {
    if (proposal.state == ProposalStates.Boosted && proposal.winningVote === VoteOptions.Yes) {
      // Boosted proposal that passed by expiring with more yes votes than no
      //   have to manually calculate beneficiary rewards

      const votableProposals = await (await proposalInstance.getVotableProposals(avatarAddress))({proposalId}, {fromBlock: 0}).get();
      const executedProposals = await (await proposalInstance.getExecutedProposals(avatarAddress))({proposalId}, {fromBlock: 0}).get();
      const proposals = [...votableProposals, ...executedProposals];
      const numberOfPeriods = proposals[0].numberOfPeriods;

      redemptions.beneficiaryEth = numberOfPeriods * proposal.ethReward;
      redemptions.beneficiaryNativeToken = numberOfPeriods * proposal.nativeTokenReward;
      redemptions.beneficiaryReputation = numberOfPeriods * proposal.reputationChange;
    } else {
      redemptions.beneficiaryEth = (await proposalInstance.contract.getPeriodsToPay(proposalId, avatarAddress, ContributionRewardType.Eth)) * proposal.ethReward;
      redemptions.beneficiaryNativeToken = (await proposalInstance.contract.getPeriodsToPay(proposalId, avatarAddress, ContributionRewardType.NativeToken)) * proposal.nativeTokenReward;
      redemptions.beneficiaryReputation = (await proposalInstance.contract.getPeriodsToPay(proposalId, avatarAddress, ContributionRewardType.Reputation)) * proposal.reputationChange;
    }
  }
  if (proposal.proposer == accountAddress) {
    redemptions.proposerReputation = Util.fromWei(await votingMachineInstance.getRedeemableReputationProposer({ proposalId })).toNumber();
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
  return anyRedemptions ? redemptions : false;
}

export type CreateDAOAction = IAsyncAction<'ARC_CREATE_DAO', {}, any>;

export function createDAO(daoName: string, tokenName: string, tokenSymbol: string, members: any): ThunkAction<any, IRootState, null> {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    try {
      let founders: Arc.FounderConfig[] = [], member: IAccountState;
      let membersByAccount: { [key: string]: IAccountState } = {};
      let totalReputation = 0, totalTokens = 0;

      members.sort((a: any, b: any) => {
        b.reputation - a.reputation;
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
        membersByAccount[member.address] = {...emptyAccount, ...member};
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
        name: daoName,
        members: membersByAccount,
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
        tokenSymbol,
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
        avatar: daoAvatarAddress,
        beneficiaryAddress,
        description,
        ethReward: Util.toWei(ethReward),
        nativeTokenReward: Util.toWei(nativeTokenReward),
        numberOfPeriods: 1,
        periodLength: 1,
        reputationChange: Util.toWei(reputationReward),
      });

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

    const currentAccountAddress: string = getState().web3.ethAccountAddress;

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
      periodLength: 1,
      reputationChange: eventResult._reputationChange
    }

    const proposal = await getProposalDetails(dao, votingMachineInstance, contributionProposal, serverProposal, currentAccountAddress);

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
    const web3: Web3 = await Arc.Utils.getWeb3();
    const currentAccountAddress: string = getState().web3.ethAccountAddress;
    const proposalId = proposal.proposalId;

    const meta = {
      avatarAddress: daoAvatarAddress,
      proposalId,
      vote,
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
        vote
      });

    } catch (err) {
      console.error(err);
      dispatch({
        type: arcConstants.ARC_VOTE,
        sequence: AsyncActionSequence.Failure,
        meta,
      } as VoteAction)
    }
  };
}

export function onVoteEvent(avatarAddress: string, proposalId: string, voterAddress: string, vote: number, reputation: number) {
  return async (dispatch: any, getState: () => IRootState) => {
    const daoInstance = await Arc.DAO.at(avatarAddress);
    const proposal: IProposalState = getState().arc.proposals[proposalId];
    const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
    const currentAccountAddress: string = getState().web3.ethAccountAddress;

    const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(avatarAddress)).votingMachineAddress;
    const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);

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
    if (proposalEnded(proposal)) {
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
        tokens: Util.fromWei(await daoInstance.token.balanceOf(voterAddress)).toNumber(),
        reputation: Util.fromWei(await daoInstance.reputation.reputationOf(voterAddress)).toNumber(),
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
    const web3: Web3 = await Arc.Utils.getWeb3();
    const currentAccountAddress: string = getState().web3.ethAccountAddress;
    const proposal: IProposalState = getState().arc.proposals[proposalId];

    const meta = {
      avatarAddress: daoAvatarAddress,
      proposalId,
      stake,
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

      const amount = new BigNumber(Util.toWei(stake));
      if (amount.lt(minimumStakingFee)) { throw new Error(`Staked less than the minimum: ${Util.fromWei(minimumStakingFee).toNumber()}!`); }

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

export function onStakeEvent(avatarAddress: string, proposalId: string, stakerAddress: string, prediction: number, stake: number) {
  return async (dispatch: any, getState: () => IRootState) => {
    const proposal: IProposalState = getState().arc.proposals[proposalId];

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
  beneficiary: any,
  dao: any
}>

export function redeemProposal(daoAvatarAddress: string, proposal: IProposalState, accountAddress: string) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const redemption = getState().arc.daos[daoAvatarAddress].members[accountAddress].redemptions[proposal.proposalId];
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
      const daoInstance = await Arc.DAO.at(daoAvatarAddress);
      const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
      const votingMachineAddress = (await contributionRewardInstance.getSchemeParameters(daoAvatarAddress)).votingMachineAddress;
      const votingMachineInstance = await Arc.GenesisProtocolFactory.at(votingMachineAddress);

      if (proposalEnded(proposal) && proposal.state !== ProposalStates.Executed) {
        const executeTx = await votingMachineInstance.contract.execute(proposal.proposalId);

        // Wait until actually executes (This is somehow needed...)
        const eventWatcher = votingMachineInstance.ExecuteProposal({_proposalId: proposal.proposalId, _avatar: daoAvatarAddress, _executionState: [ProposalStates.Executed, ProposalStates.Closed]}, {fromBlock: 'latest'})
        await new Promise((res, rej) => eventWatcher.watch(res));
        eventWatcher.stopWatching()
      }

      if (redemption.stakerBountyTokens && dao.genCount >= redemption.stakerBountyTokens) {
        const redeemDaoBountyTx = await votingMachineInstance.redeemDaoBounty({ beneficiaryAddress: accountAddress, proposalId: proposal.proposalId });
      }

      const redeemTx = await votingMachineInstance.redeem({ beneficiaryAddress: accountAddress, proposalId: proposal.proposalId });

      // If current user is the beneficiary then redeem the contribution rewards too
      if (proposal.beneficiaryAddress == accountAddress) {
        const rewardRedeemTransaction = await contributionRewardInstance.redeemContributionReward({
          proposalId: proposal.proposalId,
          avatar: daoAvatarAddress,
          ethers: dao.ethCount >= redemption.beneficiaryEth ? true : false,
          //externalTokens: true,
          nativeTokens: true,
          reputation: true,
        });
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

export function onTransferEvent(avatarAddress: string, from: string, to: string) {
  return async (dispatch: Dispatch<any>, getState: () => IRootState) => {
    const daoInstance = await Arc.DAO.at(avatarAddress);
    const fromBalance = Util.fromWei(await daoInstance.token.balanceOf(from)).toNumber();
    const toBalance = Util.fromWei(await daoInstance.token.balanceOf(to)).toNumber();
    const totalTokens = Util.fromWei(await daoInstance.token.totalSupply()).toNumber();

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
    const reputation = Util.fromWei(await daoInstance.reputation.reputationOf(address)).toNumber();
    const totalReputation = Util.fromWei(await daoInstance.reputation.totalSupply()).toNumber();

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

export function onProposalExecuted(avatarAddress: string, proposalId: string, executionState: ExecutionState, decision: VoteOptions, reputationWhenExecuted: number) {
  return async (dispatch: Dispatch<any>, getState: () => IRootState) => {
    const proposal = getState().arc.proposals[proposalId];

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
    showNotification(NotificationStatus.Success, `Proposal '${proposal.title}' Executed!`)(dispatch);
  }
}

export function onDAOEthBalanceChanged(avatarAddress: string, balance: Number) {
  return async (dispatch: Redux.Dispatch<any>, getState: () => IRootState) => {
    const dao = getState().arc.daos[avatarAddress];
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
