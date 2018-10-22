import * as fs from 'fs';
import * as Arc from "@daostack/arc.js";
const promisify = require("es6-promisify");
import * as moment from "moment";
import { denormalize, normalize } from "normalizr";
import * as Redis from 'redis';
import * as Redux from 'redux';
import loggerMiddleware from "redux-logger";
import thunkMiddleware from "redux-thunk";
const Web3 = require("web3");

import * as arcActions from "./actions/arcActions";
import * as arcConstants from "./constants/arcConstants";
import HDWalletProvider from "./lib/truffle-hdwallet-provider";
import Util from "./lib/util";
import {
  default as arcReducer,
  initialState as arcInitialState,
  checkProposalExpired,
  IArcState,
  IDaoState,
  IProposalState,
  ProposalStates,
  TransactionStates,
  IVoteState,
  RewardType
} from "./reducers/arcReducer";
import web3Reducer, { IWeb3State } from "./reducers/web3Reducer";
import * as schemas from "./schemas";
import * as selectors from "./selectors/daoSelectors";

require('dotenv').config();

const redisClient = Redis.createClient(process.env.REDIS_URL || "redis://127.0.0.1:6379");
const redisGet = promisify(redisClient.get.bind(redisClient));
const redisSet = promisify(redisClient.set.bind(redisClient));

// Setup web3 ourselves so we can use Infura or Quiknode instead of letting Arc.js setup web3
const ethProvider = process.env.ETH_PROVIDER
const networkId = process.env.ETH_NETWORK_ID;
const mnemonic = process.env.ETH_MNEMONIC;

const provider = new HDWalletProvider(mnemonic, ethProvider);
global.web3 = new Web3(provider.engine);

const arcjsNetwork = process.env.arcjs_network;
const cacheFileName = '/app/cache/initialArcState-' + arcjsNetwork + '.json';

// Use redux store for the state
interface IRootState {
  arc: IArcState;
  web3: IWeb3State;
}

const reducers = {
  arc: arcReducer,
  web3: web3Reducer,
};

let initialState: IRootState;
let store = Redux.createStore(
  Redux.combineReducers(reducers),
  Redux.applyMiddleware(thunkMiddleware)
);

process.on('SIGTERM', async () => {
  console.log("[LOCK OFF] Got SIGTERM so exiting & resetting lock");
  await redisSet('alchemy-caching-' + arcjsNetwork, 0);
  process.exit(0);
});

process.on('SIGUSR2', async () => {
  console.log(`[LOCK OFF] Got restart signal from nodemon`);
  await redisSet('alchemy-caching-' + arcjsNetwork, 0);
})

process.on('unhandledRejection', async (error) => {
  await redisSet('alchemy-caching-' + arcjsNetwork, 0);
  console.log(`[LOCK OFF] Got unhandled rejection so resetting lock`);
  console.error(error);
  process.exit(1)
})

Arc.ConfigService.set("txDepthRequiredForConfirmation", { kovan: 0, live: 0});

console.log(`Starting app in environment: ${JSON.stringify(process.env,null,2)}`);

Arc.ConfigService.set("logLevel", 15);

(async () => {
  await Arc.InitializeArcJs();
})();

async function updateCache() {
  if (Number(await redisGet('alchemy-caching-' + arcjsNetwork))) {
    console.log(`The cache is already being updated for network ${arcjsNetwork}.`);
    return false;
  }
  console.log(`[LOCK ON] Updating cache for network ${arcjsNetwork}`);
  await redisSet('alchemy-caching-' + arcjsNetwork, 1);

  const startTime = moment();

  // Block number to start looking fromn:
  //   first look argument passed in to script, otherwise get last block cached from redis, otherwise we start over from block 0
  let lastCachedBlock = process.argv[2] || (await redisGet('alchemy-last-block-' + arcjsNetwork)) || 0;

  // Latest block to cache up to
  const latestBlock = process.argv[3] || await Util.getLatestBlock();

  if (lastCachedBlock == 0) {
    console.log("Starting to cache the "  + arcjsNetwork + " blockchain from the beginning");
    await store.dispatch(arcActions.getDAOs(0, latestBlock));
  } else {
    console.log("Pulling current cached state for " + arcjsNetwork + " from " + cacheFileName);
    try {
      const s = JSON.parse(fs.readFileSync(cacheFileName, 'utf8'));
      const keylen = (obj: Object): Number => Object.keys(obj).length
      console.log(`Loaded: ${keylen(s.accounts)} accounts, ${keylen(s.daos)} daos, ${keylen(s.proposals)} proposals, ${keylen(s.votes)} votes, ${keylen(s.stakes)} stakes`)
      initialState = s;
      await store.dispatch({ type: arcConstants.ARC_LOAD_CACHED_STATE_FULFILLED, payload: initialState });
    } catch (e) {
      console.log("error = ", e);
    }

    console.log("Starting to cache the "  + arcjsNetwork + " blockchain from block ", lastCachedBlock, "to block", latestBlock);

    // Look for new DAOs
    console.log("Looking for new DAOs");
    await store.dispatch(arcActions.getDAOs(lastCachedBlock, latestBlock));

    // TODO: if there is a new DAO then i think we need to wait for it to be loaded completely
    console.log("Done looking for new DAOs, now looking for new proposals");

    // Watch for new, confirmed proposals coming in
    const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
    const proposalEventWatcher = contributionRewardInstance.NewContributionProposal({ }, { fromBlock: lastCachedBlock, toBlock: latestBlock });
    const getProposalEvents = promisify(proposalEventWatcher.get);
    const proposalEvents: Array<Arc.DecodedLogEntryEvent<Arc.NewContributionProposalEventResult>> = await getProposalEvents(null, -1);
    for (let index = 0; index < proposalEvents.length; index++) {
      const event = proposalEvents[index];
      console.log("Got new proposal", event.args);
      await store.dispatch(arcActions.onProposalCreateEvent(event.args));
    }

    console.log("Done looking for new proposals, now looking for new stakes");

    // TODO: look for allEvents on the voting machine instance to process these in the exact order they happened
    const votingMachineInstance = await Arc.GenesisProtocolFactory.deployed();

    const stakeEventWatcher = votingMachineInstance.Stake({ }, { fromBlock: lastCachedBlock, toBlock: latestBlock });
    const getStakeEvents = promisify(stakeEventWatcher.get);
    const stakeEvents: Array<Arc.DecodedLogEntryEvent<Arc.StakeEventResult>> = await getStakeEvents(null, -1);
    for (let index = 0; index < stakeEvents.length; index++) {
      const event = stakeEvents[index];
      console.log("Got new stake", event.args);
      await store.dispatch(arcActions.onStakeEvent(event.args._avatar, event.args._proposalId, event.args._staker, Number(event.args._vote), Util.fromWei(event.args._amount)));
    }

    console.log("Done looking for new stakes, now looking for new votes");

    const voteEventWatcher = votingMachineInstance.VoteProposal({ }, { fromBlock: lastCachedBlock, toBlock: latestBlock });
    const getVoteEvents = promisify(voteEventWatcher.get);
    const voteEvents: Array<Arc.DecodedLogEntryEvent<Arc.VoteProposalEventResult>> = await getVoteEvents(null, -1);
    for (let index = 0; index < voteEvents.length; index++) {
      const event = voteEvents[index];
      console.log("Got new vote", event.args);
      await store.dispatch(arcActions.onVoteEvent(event.args._avatar, event.args._proposalId, event.args._voter, Number(event.args._vote), Util.fromWei(event.args._reputation)));
    }

    console.log("Done looking for new votes, now looking for executed proposals");

    const executeProposalEventWatcher = votingMachineInstance.ExecutedProposals({}, { fromBlock: lastCachedBlock, toBlock: latestBlock });
    const getExecutedProposalEvents = promisify(executeProposalEventWatcher.get);
    const executedProposalEvents: Arc.ExecutedGenesisProposal[] = await getExecutedProposalEvents(null, -1);
    for (let index = 0; index < executedProposalEvents.length; index++) {
      const event = executedProposalEvents[index];
      console.log("Proposal executed", event);
      const { avatarAddress, proposalId, decision, totalReputation, executionState } = event;
      await store.dispatch(arcActions.onProposalExecuted(avatarAddress, proposalId, executionState, Number(decision), Util.fromWei(totalReputation)));
    }

    console.log("Done with executed proposals, now looking for redemptions");

    const redeemEth = await contributionRewardInstance.RedeemEther({}, {fromBlock: lastCachedBlock, toBlock: latestBlock}).get(undefined, -1);
    await Promise.all(redeemEth.map(({args: {_proposalId, _avatar, _beneficiary}}) => {
      console.log(`Redeeming ContributionReward ETH for account ${_beneficiary} on proposal ${_proposalId}`);
      store.dispatch(arcActions.onRedeemReward(_avatar, _proposalId, _beneficiary, RewardType.Eth, true))
    }));

    const redeemGen = await contributionRewardInstance.RedeemExternalToken({}, {fromBlock: lastCachedBlock, toBlock: latestBlock}).get(undefined, -1);
    await Promise.all(redeemGen.map(({args: {_proposalId, _avatar, _beneficiary}}) => {
      console.log(`Redeeming ContributionReward external token for account ${_beneficiary} on proposal ${_proposalId}`);
      store.dispatch(arcActions.onRedeemReward(_avatar, _proposalId, _beneficiary, RewardType.ExternalToken, true))
    }));

    const redeemToken = await contributionRewardInstance.RedeemNativeToken({}, {fromBlock: lastCachedBlock, toBlock: latestBlock}).get(undefined, -1);
    await Promise.all(redeemToken.map(({args: {_proposalId, _avatar, _beneficiary}}) => {
      console.log(`Redeeming ContributionReward native token for account ${_beneficiary} on proposal ${_proposalId}`);
      store.dispatch(arcActions.onRedeemReward(_avatar, _proposalId, _beneficiary, RewardType.NativeToken, true))
    }));

    const redeemRep = await contributionRewardInstance.RedeemReputation({}, {fromBlock: lastCachedBlock, toBlock: latestBlock}).get(undefined, -1);
    await Promise.all(redeemRep.map(({args: {_proposalId, _avatar, _beneficiary}}) => {
      console.log(`Redeeming ContributionReward reputation for account ${_beneficiary} on proposal ${_proposalId}`);
      store.dispatch(arcActions.onRedeemReward(_avatar, _proposalId, _beneficiary, RewardType.Reputation, true))
    }));

    const redeem = await votingMachineInstance.Redeem({}, {fromBlock: lastCachedBlock, toBlock: latestBlock}).get(undefined, -1);
    await Promise.all(redeem.map(({args: {_proposalId, _avatar, _beneficiary}}) => {
      console.log(`Redeeming GenesisProtocol GEN for account ${_beneficiary} on proposal ${_proposalId}`);
      store.dispatch(arcActions.onRedeemReward(_avatar, _proposalId, _beneficiary, RewardType.GEN, false))
    }));

    const redeemDaoBounty = await votingMachineInstance.RedeemDaoBounty({}, {fromBlock: lastCachedBlock, toBlock: latestBlock}).get(undefined, -1);
    await Promise.all(redeemDaoBounty.map(({args: {_proposalId, _avatar, _beneficiary}}) => {
      console.log(`Redeeming GenesisProtocol staker bounty GEN for account ${_beneficiary} on proposal ${_proposalId}`);
      store.dispatch(arcActions.onRedeemReward(_avatar, _proposalId, _beneficiary, RewardType.BountyGEN, false))
    }));

    const redeemRepGP = await votingMachineInstance.RedeemReputation({}, {fromBlock: lastCachedBlock, toBlock: latestBlock}).get(undefined, -1);
    await Promise.all(redeemRepGP.map(({args: {_proposalId, _avatar, _beneficiary}}) => {
      console.log(`Redeeming GenesisProtocol reputation for account ${_beneficiary} on proposal ${_proposalId}`);
      store.dispatch(arcActions.onRedeemReward(_avatar, _proposalId, _beneficiary, RewardType.Reputation, false))
    }));

    console.log("Done with redemptions, now updating DAOs");

    const stakingTokenAddress = await votingMachineInstance.contract.stakingToken();
    const stakingToken = await (await Arc.Utils.requireContract("StandardToken")).at(stakingTokenAddress) as any;

    const state = (store.getState() as IRootState);
    for (const avatarAddress of Object.keys(state.arc.daos)) {
      const dao = denormalize(state.arc.daos[avatarAddress], schemas.daoSchema, state.arc) as IDaoState;
      const daoInstance = await Arc.DAO.at(avatarAddress);

      console.log(`Looking at DAO ${avatarAddress}, updating reputation balances`);

      const mintEventWatcher = daoInstance.reputation.Mint({}, { fromBlock: lastCachedBlock, toBlock: latestBlock });
      const getMintEvents = promisify(mintEventWatcher.get);
      const mintEvents = await getMintEvents(null, -1);
      for (let index = 0; index < mintEvents.length; index++) {
        const event = mintEvents[index];
        console.log("Reputation minted for account", event.args._to, "in DAO", avatarAddress);
        await store.dispatch(arcActions.onReputationChangeEvent(avatarAddress, event.args._to));
      }

      const burnEventWatcher = daoInstance.reputation.Burn({}, { fromBlock: lastCachedBlock, toBlock: latestBlock });
      const getBurnEvents = promisify(burnEventWatcher.get);
      const burnEvents = await getBurnEvents(null, -1);
      for (let index = 0; index < burnEvents.length; index++) {
        const event = burnEvents[index];
        console.log("Reputation burned from account", event.args._from, "in DAO", avatarAddress);
        await store.dispatch(arcActions.onReputationChangeEvent(avatarAddress, event.args._from));
      }

      console.log("Done updating reputation, now update DAO balances");

      const newEthBalance = Util.fromWei(await promisify(global.web3.eth.getBalance)(avatarAddress));
      await store.dispatch(arcActions.onDAOEthBalanceChanged(avatarAddress, newEthBalance));
      const newGenBalance = Util.fromWei(await stakingToken.balanceOf(avatarAddress));
      await store.dispatch(arcActions.onDAOGenBalanceChanged(avatarAddress, newGenBalance));

      if (dao.externalTokenAddress) {
        const externalToken = await (await Arc.Utils.requireContract("StandardToken")).at(dao.externalTokenAddress) as any;
        const balance = Util.fromWei(await externalToken.balanceOf(avatarAddress));
        await store.dispatch(arcActions.onDAOExternalTokenBalanceChanged(avatarAddress, balance));
      }

      console.log("Done updating balances, now look for any expired proposals");

      // Check all open proposals to see if any expired and if so update state and gather redemptions
      let proposals = dao.proposals as IProposalState[];
      proposals = proposals.filter((proposal: IProposalState) => (
        proposal.state === ProposalStates.PreBoosted ||
        proposal.state === ProposalStates.Boosted ||
        proposal.state === ProposalStates.QuietEndingPeriod
      ));
      for (const proposal of proposals) {
        if (checkProposalExpired(proposal) != proposal.state) {
          console.log("Proposal expired", proposal.proposalId, proposal.title);
          await store.dispatch(arcActions.onProposalExpired(proposal));
        }
      }
    }
  }

  const arcState = (store.getState() as IRootState).arc;
  if (arcState.daosLoaded) {
    // Write cached blockchain data to S3
    console.log("Writing state to disk");

    try {
      fs.writeFileSync(cacheFileName, JSON.stringify(arcState), 'utf8')
      console.log("Successfully wrote cached data for " + arcjsNetwork + " to disk.");
    } catch (e) {
      console.error("Error writing data to disk: ", e, e.stack);
    }

    console.log("Updating last block read on redis: ", latestBlock);
    await redisSet('alchemy-last-block-' + arcjsNetwork, latestBlock);

    const endTime = moment();
    const duration = moment.duration(endTime.diff(startTime));
    const minutes = duration.asMinutes();
    console.log("Finishing updating cache after " + minutes + " minutes");
  } else {
    console.log("Something weird happened, DAOs not loaded so didn't write the data");
  }
  console.log(`[LOCK OFF] Done caching`);
  await redisSet('alchemy-caching-' + arcjsNetwork, 0);
  return true;
}

export default updateCache;
