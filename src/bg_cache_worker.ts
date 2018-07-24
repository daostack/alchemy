// tslint:disable:no-var-requires
// tslint:disable:no-console

// Hack to be able to find all our modules with relative paths
process.env.NODE_PATH = __dirname;
require('module').Module._initPaths();

import * as Arc from "@daostack/arc.js";
import * as aws from 'aws-sdk';
import promisify = require("es6-promisify");
import * as moment from "moment";
import { normalize } from "normalizr";
import * as Redis from 'redis';
import * as Redux from 'redux';
import loggerMiddleware from "redux-logger";
import thunkMiddleware from "redux-thunk";

import HDWalletProvider from "./lib/truffle-hdwallet-provider";

// haven’t figured out how to get web3 typings to properly expose the Web3 constructor.
// v1.0 may improve on this entire Web3 typings experience
/* tslint:disable-next-line:no-var-requires */
const Web3 = require("web3");

import * as arcActions from "./actions/arcActions";
import * as arcConstants from "constants/arcConstants";
import { default as rootReducer, IRootState } from "./reducers/index";
import { default as arcReducer, initialState as arcInitialState, emptyAccount, IArcState, IDaoState, TransactionStates, IVoteState } from "./reducers/arcReducer";
import web3Reducer, { IWeb3State } from "./reducers/web3Reducer";

import * as ActionTypes from "constants/arcConstants";
import * as schemas from "./schemas";
import Util from "./lib/util";

require('dotenv').config();

async function updateCache() {
  const startTime = moment();

  const arcjsNetwork = process.env.arcjs_network;

  if (process.env.NODE_ENV == 'production') {
    // Use Infura on production
    const infuraNetwork = arcjsNetwork == 'live' ? 'mainnet' : arcjsNetwork;

    // The default account in reading from Infura, I'm not totally sure why this is needed (but it is), or what account it should be
    const mnemonic = process.env.DEFAULT_ACCOUNT_MNEMONIC;
    const infuraKey = process.env.INFURA_KEY;
    const provider = new HDWalletProvider(mnemonic, "https://" + infuraNetwork + ".infura.io/" + infuraKey);

    // Setup web3 ourselves so we can use Infura instead of letting Arc.js setup web3
    global.web3 = new Web3(provider.engine);

    process.env.API_URL = process.env.API_URL || "https://daostack-alchemy.herokuapp.com";
  } else {
    process.env.API_URL = process.env.API_URL || "http://127.0.0.1:3001";
  }

  await Arc.InitializeArcJs();

  aws.config.region = 'us-west-2';
  const s3 = new aws.S3();
  const s3FileName = 'initialArcState-' + arcjsNetwork + '.json';
  const s3FileType = 'application/json';

  const redisClient = Redis.createClient();

  const redisGet = promisify(redisClient.get.bind(redisClient));
  const redisSet = promisify(redisClient.set.bind(redisClient));

  // Block number to start looking fromn:
  //   first look argument passed in to script, otherwise get last block cached from redis, otherwise we start over from block 0
  let lastCachedBlock = process.argv[2] || (await redisGet('alchemy-last-block-' + arcjsNetwork)) || 0;

  // Latest block to cache up to
  const latestBlock = await Util.getLatestBlock();

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
    Redux.applyMiddleware(thunkMiddleware, loggerMiddleware)
  );

  // Subscribe to the redux store changes
  const unsubscribe = store.subscribe(async () => {
    const arcState = (store.getState() as IRootState).arc;
    console.log("xsubscrib callback ");
    if (arcState.daosLoaded) {
      // Write cached blockchain data to S3
      console.log("xWriting state to S3");
      const s3Params = {
        Body: JSON.stringify(arcState),
        Bucket: process.env.S3_BUCKET || 'daostack-alchemy',
        Key: s3FileName,
        //Expires: 60,
        ContentType: s3FileType,
        ACL: 'public-read'
      };
      s3.putObject(s3Params, (err, data) => {
        if (err) {
          console.error("Error writing data to S3 = ", err, err.stack);
        } else {
          // tslint:disable-next-line:no-console
          console.log("Successfully wrote cached data for " + arcjsNetwork + " to S3. ", data);
        }
      });
      const endTime = moment();
      const duration = moment.duration(endTime.diff(startTime));
      const minutes = duration.asMinutes();
      console.log("Finishing data cache after " + minutes + " minutes");
    }
  });

  process.on('SIGTERM', function () {
    unsubscribe();
    process.exit(0);
  });

  if (lastCachedBlock == 0) {
    console.log("Starting to cache the "  + arcjsNetwork + " blockchain from the beginning");
    store.dispatch(arcActions.getDAOs(0, latestBlock));
  } else {
    console.log("Pulling current cached state for " + arcjsNetwork + " from S3 bucket " + process.env.S3_BUCKET);
    try {
      const s3Get = promisify(s3.getObject.bind(s3));
      const resp = await s3Get({Bucket: process.env.S3_BUCKET || 'daostack-alchemy', Key: s3FileName})
      initialState = JSON.parse(resp.Body.toString('utf-8'));
      await store.dispatch({ type: arcConstants.ARC_LOAD_CACHED_STATE_FULFILLED, payload: initialState });
    } catch (e) {
      console.log("error = ", e);
    }

    console.log("Starting to cache the "  + arcjsNetwork + " blockchain from block ", lastCachedBlock, "to block", latestBlock);

    // Look for new DAOs
    console.log("looking for new DAOs");
    await store.dispatch(arcActions.getDAOs(lastCachedBlock, latestBlock));

    // TODO: if there is a new DAO then i think we need to wait for it to be loaded completely
    console.log("done for new DAOs, now new proposals");

    // Watch for new, confirmed proposals coming in
    const contributionRewardInstance = await Arc.ContributionRewardFactory.deployed();
    this.proposalEventWatcher = contributionRewardInstance.NewContributionProposal({ }, { fromBlock: lastCachedBlock, toBlock: latestBlock });
    await this.proposalEventWatcher.get(async (error: Error, eventsArray: Array<Arc.DecodedLogEntryEvent<Arc.NewContributionProposalEventResult>>) => {
      console.log("got new proposal", error, eventsArray);
      for (let index = 0; index < eventsArray.length; index++) {
        const event = eventsArray[index];
        await store.dispatch(arcActions.onProposalCreateEvent(event.args));
      }
    });

    console.log("done for new proposals, now new stakes");

    const votingMachineInstance = await Arc.GenesisProtocolFactory.deployed();

    this.stakeEventWatcher = votingMachineInstance.Stake({ }, { fromBlock: lastCachedBlock, toBlock: latestBlock });
    await this.stakeEventWatcher.get(async (error: Error, eventsArray: Array<Arc.DecodedLogEntryEvent<Arc.StakeEventResult>>) => {
      console.log("got stake", error, eventsArray);
      for (let index = 0; index < eventsArray.length; index++) {
        const event = eventsArray[index];
        await store.dispatch(arcActions.onStakeEvent(event.args._avatar, event.args._proposalId, event.args._staker, Number(event.args._vote), Util.fromWei(event.args._amount)));
      }
    });

    console.log("done for new stakes, now new votes");

    this.voteEventWatcher = votingMachineInstance.VoteProposal({ }, { fromBlock: lastCachedBlock, toBlock: latestBlock });
    await this.voteEventWatcher.get(async (error: Error, eventsArray: Array<Arc.DecodedLogEntryEvent<Arc.VoteProposalEventResult>>) => {
      console.log("got vote", error, eventsArray);
      if (error) {
        console.error("Error getting votes", error);
      } else {
        for (let index = 0; index < eventsArray.length; index++) {
          const event = eventsArray[index];
          await store.dispatch(arcActions.onVoteEvent(event.args._avatar, event.args._proposalId, event.args._voter, Number(event.args._vote), Util.fromWei(event.args._reputation)));
        }
      }
    });

    console.log("done for new votes, now executed proposal");

    this.executeProposalEventWatcher = votingMachineInstance.ExecutedProposals({}, { fromBlock: lastCachedBlock, toBlock: latestBlock });
    await this.executeProposalEventWatcher.get(async (error: Error, eventsArray: Array<Arc.ExecutedGenesisProposal>) => {
      console.log("got executed proposal", error, eventsArray);
      for (let index = 0; index < eventsArray.length; index++) {
        const event = eventsArray[index];
        const { avatarAddress, proposalId, decision, totalReputation, executionState } = event;
        await store.dispatch(arcActions.onProposalExecuted(avatarAddress, proposalId, executionState, Number(decision), Util.fromWei(totalReputation)));
      }
    });

    console.log("done with executed proposals, now token and reputation balances");

    const stakingTokenAddress = await votingMachineInstance.contract.stakingToken();
    const stakingToken = await (await Arc.Utils.requireContract("StandardToken")).at(stakingTokenAddress) as any;

    const daos = (store.getState() as IRootState).arc.daos;
    Object.keys(daos).forEach(async (avatarAddress) => {
      const daoInstance = await Arc.DAO.at(avatarAddress);

      this.mintEventWatcher = daoInstance.reputation.Mint({}, { fromBlock: lastCachedBlock, toBlock: latestBlock });
      await this.mintEventWatcher.get(async (error: any, eventsArray: any) => {
        for (let index = 0; index < eventsArray.length; index++) {
          const event = eventsArray[index];
          await store.dispatch(arcActions.onReputationChangeEvent(avatarAddress, event.args._to));
        }
      });

      this.burnEventWatcher = daoInstance.reputation.Burn({}, { fromBlock: lastCachedBlock, toBlock: latestBlock });
      await this.burnEventWatcher.get(async (error: any, eventsArray: any) => {
        for (let index = 0; index < eventsArray.length; index++) {
          const event = eventsArray[index];
          await store.dispatch(arcActions.onReputationChangeEvent(avatarAddress, event.args._from));
        }
      });

      const newEthBalance = Util.fromWei(await promisify(global.web3.eth.getBalance)(avatarAddress));
      await arcActions.onDAOEthBalanceChanged(avatarAddress, newEthBalance);
      const newGenBalance = Util.fromWei(await stakingToken.balanceOf(avatarAddress));
      await arcActions.onDAOGenBalanceChanged(avatarAddress, newGenBalance);
    });
  }

  redisSet('alchemy-last-block-' + arcjsNetwork, latestBlock);
}

export default updateCache;
