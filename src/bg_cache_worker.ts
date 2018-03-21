// Hack to be able to find all our modules with relative paths
process.env.NODE_PATH = __dirname;
require('module').Module._initPaths();

import * as Arc from "@daostack/arc.js";
import * as fs from 'fs';
import * as Redis from 'ioredis';
import { normalize } from "normalizr";
import promisify = require("es6-promisify");
import HDWalletProvider from "./lib/truffle-hdwallet-provider";
import Web3 = require("web3");

import * as arcActions from "./actions/arcActions";
import { initialState as arcInitialState, IArcState, IDaoState, TransactionStates, IVoteState } from "./reducers/arcReducer";
import * as schemas from "./schemas";
import Util from "./lib/util";

const redis = new Redis();

const mnemonic = "upstart driveway blighted quartet machinist garter clinic sash enjoyment reputable unknotted elastic";

const network = Arc.Config.get('network');
if (process.env.NODE_ENV == 'production') {
  // Use Infura on production
  const infura_network = network == 'live' ? 'mainnet' : network;
  const provider = new HDWalletProvider(mnemonic, "https://" + infura_network + ".infura.io/UeW8cwaou03qFgsAHoDP");

  // Setup web3 ourselves so we can use Infura instead of letting Arc.js setup web3
  global.web3 = new Web3(provider.engine);

  process.env.API_URL = process.env.API_URL || "https://daostack-alchemy.herokuapp.com";
} else {
  process.env.API_URL = "http://127.0.0.1:3001";
}

const cacheBlockchain = async () => {
  // TODO: store cached data and last block in redis and only load new data since last check
  let lastBlock = Number(redis.get('alchemy-last-block')) || 0;

  console.log("Starting to cache the blockchain from block ", lastBlock);

  let initialState: IArcState = arcInitialState;
  const daos = {} as { [key: string]: IDaoState };

  const daoCreator = await Arc.DaoCreator.deployed();

  try {
    // Get the list of daos we populated on the blockchain during genesis by looking for InitialSchemesSet events
    // Also load all the proposals for every DAO
    const newDaoEventsWatcher = daoCreator.InitialSchemesSet({}, { fromBlock: lastBlock });
    const getNewDaoEvents = promisify(newDaoEventsWatcher.get.bind(newDaoEventsWatcher));
    const newDaoEvents = await getNewDaoEvents();
    for (let index = 0; index < newDaoEvents.length; index++) {
      const event = newDaoEvents[index];
      daos[event.args._avatar] = await arcActions.getDAOData(event.args._avatar, true);
    }
  } catch (e) {
    console.log("Error getting DAOs: ", e);
    return;
  }
  initialState.daosLoaded = true;

  const normalizedData = normalize(daos, schemas.daoList);
  initialState.daos = normalizedData.entities.daos;
  initialState.proposals = normalizedData.entities.proposals;

  const genesisProtocol = await Arc.GenesisProtocol.deployed();

  let proposalDetails;
  try {
    // Get all votes ever made
    const voteEventWatcher = genesisProtocol.VoteProposal({}, { fromBlock: lastBlock });
    const getVoteEvents = promisify(voteEventWatcher.get.bind(voteEventWatcher));
    const voteEvents = await getVoteEvents();
    let voteEventArgs;
    for (let cnt = 0; cnt < voteEvents.length; cnt++) {
      voteEventArgs = voteEvents[cnt].args;
      proposalDetails = initialState.proposals[voteEventArgs._proposalId];

      // If voter not already added as a member on the DAO set them up (this should not happen right?)
      if (!initialState.daos[proposalDetails.daoAvatarAddress].members[voteEventArgs._voter]) {
        initialState.daos[proposalDetails.daoAvatarAddress].members[voteEventArgs._voter] = { reputation: 0, tokens: 0, votes: {}, stakes: {}};
      }
      initialState.daos[proposalDetails.daoAvatarAddress].members[voteEventArgs._voter].votes[voteEventArgs._proposalId] = {
        avatarAddress: proposalDetails.daoAvatarAddress,
        proposalId: voteEventArgs._proposalId,
        reputation: Util.fromWei(voteEventArgs._reputation),
        transactionState: TransactionStates.Confirmed,
        vote: Number(voteEventArgs._vote),
        voterAddress: voteEventArgs._voter
      }
    }
  } catch (e) {
    console.log("Error getting votes: ", e)
  }

  try {
    // Get all stakes ever made
    const stakeEventWatcher = genesisProtocol.Stake({}, { fromBlock: lastBlock });
    const getStakeEvents = promisify(stakeEventWatcher.get.bind(stakeEventWatcher));
    const stakeEvents = await getStakeEvents();
    let stakeEventArgs;
    for (let cnt = 0; cnt < stakeEvents.length; cnt++) {
      stakeEventArgs = stakeEvents[cnt].args;
      proposalDetails = initialState.proposals[stakeEventArgs._proposalId];

      // If staker not already added as a member on the DAO set them up (this should not happen right?)
      if (!initialState.daos[proposalDetails.daoAvatarAddress].members[stakeEventArgs._voter]) {
        initialState.daos[proposalDetails.daoAvatarAddress].members[stakeEventArgs._voter] = { reputation: 0, tokens: 0, votes: {}, stakes: {}};
      }
      initialState.daos[proposalDetails.daoAvatarAddress].members[stakeEventArgs._voter].stakes[stakeEventArgs._proposalId] = {
        avatarAddress: proposalDetails.daoAvatarAddress,
        proposalId: stakeEventArgs._proposalId,
        transactionState: TransactionStates.Confirmed,
        stake: Util.fromWei(stakeEventArgs._amount),
        prediction: Number(stakeEventArgs._vote),
        stakerAddress: stakeEventArgs._voter
      }
    }
  } catch (e) {
    console.log("Error getting stakes: ", e);
  }

  fs.writeFile(__dirname + '/initialArcState-' + network + '.json', JSON.stringify(initialState), (err) => {
    if (err) {
      throw err;
    }

    console.log('The file has been saved!');
  });

  setTimeout(cacheBlockchain, 1000);
};

cacheBlockchain();
