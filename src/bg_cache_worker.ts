// Hack to be able to find all our modules with relative paths
process.env.NODE_PATH = __dirname;
// tslint:disable-next-line:no-var-requires
require('module').Module._initPaths();

import * as Arc from "@daostack/arc.js";
import * as aws from 'aws-sdk';
import { normalize } from "normalizr";
import promisify = require("es6-promisify");
import HDWalletProvider from "./lib/truffle-hdwallet-provider";

// haven’t figured out how to get web3 typings to properly expose the Web3 constructor.
// v1.0 may improve on this entire Web3 typings experience
/* tslint:disable-next-line:no-var-requires */
const Web3 = require("web3");

import * as arcActions from "./actions/arcActions";
import { initialState as arcInitialState, emptyAccount, IArcState, IDaoState, TransactionStates, IVoteState } from "./reducers/arcReducer";
import * as schemas from "./schemas";
import Util from "./lib/util";

// tslint:disable-next-line:no-var-requires
require('dotenv').config();

(async () => {
  const arcjsNetwork = (await Arc.Utils.getNetworkName()).toLowerCase();

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

  // TODO: store last block checked somewhere (redis?) and only load new data since last check
  let lastBlock = 0;

  // tslint:disable-next-line:no-console
  console.log("Starting to cache the blockchain from block ", lastBlock);

  let initialState: IArcState = arcInitialState;
  const daos = {} as { [key: string]: IDaoState };

  const daoCreator = Arc.WrapperService.wrappers.DaoCreator;

  try {
    // Get the list of daos we populated on the blockchain during genesis by looking for InitialSchemesSet events
    // Also load all the proposals for every DAO
    const newDaoEventsWatcher = daoCreator.InitialSchemesSet({}, { fromBlock: lastBlock });
    const getNewDaoEvents = promisify(newDaoEventsWatcher.get.bind(newDaoEventsWatcher));
    const newDaoEvents = await getNewDaoEvents();
    for (let index = 0; index < newDaoEvents.length; index++) {
      const event = newDaoEvents[index];
      const daoData = await arcActions.getDAOData(event.args._avatar, true);
      if (daoData) {
        daos[event.args._avatar] = daoData;
      }
    }
  } catch (e) {
    console.error("Error getting DAOs: ", e);
    return;
  }
  initialState.daosLoaded = true;

  const normalizedData = normalize(daos, schemas.daoList);
  // TODO: use arcReducer to handle this adding
  initialState.daos = normalizedData.entities.daos || {};
  initialState.proposals = normalizedData.entities.proposals || {};

  const genesisProtocol = Arc.WrapperService.wrappers.GenesisProtocol;

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
        initialState.daos[proposalDetails.daoAvatarAddress].members[voteEventArgs._voter] = { ...emptyAccount, address: voteEventArgs._voter };
      }
      // TODO: use arcReducer to add this.
      // XXX: copying the object is required here or else it adds this vote to every member in the DAO somehow
      const memberVotes = Object.assign({}, initialState.daos[proposalDetails.daoAvatarAddress].members[voteEventArgs._voter].votes);
      memberVotes[voteEventArgs._proposalId] = {
        avatarAddress: proposalDetails.daoAvatarAddress,
        proposalId: voteEventArgs._proposalId,
        reputation: Util.fromWei(voteEventArgs._reputation).toNumber(),
        transactionState: TransactionStates.Confirmed,
        vote: Number(voteEventArgs._vote),
        voterAddress: voteEventArgs._voter
      };
      initialState.daos[proposalDetails.daoAvatarAddress].members[voteEventArgs._voter].votes = memberVotes;
    }
  } catch (e) {
    console.error("Error getting votes: ", e)
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
        initialState.daos[proposalDetails.daoAvatarAddress].members[stakeEventArgs._voter] = { ...emptyAccount, address: stakeEventArgs._voter };
      }
      const memberStakes = Object.assign({}, initialState.daos[proposalDetails.daoAvatarAddress].members[stakeEventArgs._voter].stakes);
      memberStakes[stakeEventArgs._proposalId] = {
        avatarAddress: proposalDetails.daoAvatarAddress,
        proposalId: stakeEventArgs._proposalId,
        transactionState: TransactionStates.Confirmed,
        stake: Util.fromWei(stakeEventArgs._amount).toNumber(),
        prediction: Number(stakeEventArgs._vote),
        stakerAddress: stakeEventArgs._voter
      }
      initialState.daos[proposalDetails.daoAvatarAddress].members[stakeEventArgs._voter].stakes = memberStakes;
    }
  } catch (e) {
    console.error("Error getting stakes: ", e);
  }

  // Write cached blockchain data to S3
  aws.config.region = 'us-west-2';
  const s3 = new aws.S3();
  const fileName = 'initialArcState-' + arcjsNetwork + '.json';
  const fileType = 'application/json';
  const s3Params = {
    Body: JSON.stringify(initialState),
    Bucket: process.env.S3_BUCKET || 'daostack-alchemy',
    Key: fileName,
    //Expires: 60,
    ContentType: fileType,
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
})();
