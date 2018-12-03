import * as Arc from '@daostack/arc.js';
import * as fs from 'fs';
import * as moment from 'moment';
import * as yargs from 'yargs';
import { createLogger, transports, format } from 'winston';
const { combine, colorize, timestamp, printf } = format;
import axios from 'axios';
import chalk from 'chalk';
import HDWalletProvider from '../src/lib/truffle-hdwallet-provider';
import { ContributionRewardWrapper, GenesisProtocolWrapper, StandardTokenFactory } from '@daostack/arc.js';
import { DAO, VoteOptions } from '@daostack/arc.js';
// tslint:disable-next-line:no-var-requires
const Web3 = require("web3");
import promisify = require("es6-promisify");
// tslint:disable-next-line:no-var-requires
const NonceTrackerSubprovider = require("web3-provider-engine/subproviders/nonce-tracker");
// tslint:disable-next-line:no-var-requires
require('dotenv').config(); // load .env file into `process.env`

import Util from '../src/lib/util';

enum Network {
  Mainnet = 'mainnet',
  Kovan = 'kovan',
  Private = 'private',
}

interface Founder {
  id: number,
  reputation: number;
}

interface CreateDAOOpts {
  address?: string;
  name: string,
  tokenName: string,
  tokenSymbol: string,
  params: Arc.GenesisProtocolParams,
  founders: Founder[]
}

interface SwitchAccountOpts { id: number }

interface CreateProposalOpts {
  id: number;
  description: string,
  title: string,
  beneficiary: string,
  amount: number,
  reputation: number
}

interface VoteOpts {
  id: number;
  proposalId: string,
  vote: 'Yes' | 'No',
}

interface StakeOpts {
  id: number;
  proposalId: string,
  vote: 'Yes' | 'No',
  amount: number;
}

enum Action {
  SwitchAccount = 'SwitchAccount',
  CreateProposal = 'CreateProposal',
  Vote = 'Vote',
  Stake = 'Stake'
}

type Step =
  { action: Action.SwitchAccount, args: SwitchAccountOpts } |
  { action: Action.CreateProposal, args: CreateProposalOpts } |
  { action: Action.Vote, args: VoteOpts } |
  { action: Action.Stake, args: StakeOpts };

interface Opts extends CreateDAOOpts {
  steps: Step[];
  network: Network;
  logfile: string;
  mnemonic: string;
  dai: boolean
}

async function main(options: Opts) {

  const logger = createLogger({
    format: combine(
      timestamp(),
      colorize(),
      printf(({level, timestamp, message}) => chalk`{bold ${moment(timestamp).format("DD/MM/YYYY hh:mm:ss A")} [${level}]: ${message}}`)
    ),
    transports: [
      new transports.Console(),
    ]
  });

  const proposalIds: { [id: number]: string } = {}; // mapping from the script's ids to GP proposalIds
  const approved: { [address: string]: boolean } = {}; // did we already approve 100000 GEN for an address?
  let i: number = 0;

  const {
    address,
    steps,
    network,
    mnemonic,
    logfile,
    params,
    name,
    tokenName,
    tokenSymbol,
    founders,
    dai,
  } = options;

  const api =
    network === Network.Private ?
      'http://127.0.0.1:3001/api/' :
    network === Network.Mainnet ?
      'https://daostack-alchemy.herokuapp.com/api/' :
      'https://daostack-alchemy-server-stage.herokuapp.com/api/'
  ;
  logger.info(`Using api URL: ${api}`)

  const infuraKey = process.env.INFURA_KEY;
  if (network !== 'private' && !infuraKey) {
    throw new Error('Please include a line `INFURA_KEY=...` in a .env file in the current directory');
  }
  const provider = new HDWalletProvider(mnemonic, network === 'private' ? 'http://localhost:8545' : `https://${network === Network.Mainnet ? '' : network + '.'}infura.io/` + infuraKey, 0, 10);

  // Needed to track nonces correctly https://ethereum.stackexchange.com/questions/44349/truffle-infura-on-mainnet-nonce-too-low-error
  const nonceTracker = new NonceTrackerSubprovider();
  provider.engine._providers.unshift(nonceTracker);
  nonceTracker.setEngine(provider.engine);

  (global as any).web3 = new Web3(provider.engine);

  await Arc.InitializeArcJs();
  const web3 = await Arc.Utils.getWeb3();

  const accounts = await promisify(web3.eth.getAccounts)()

  if (logfile && fs.existsSync(logfile)) {
    logger.add(new transports.File({filename: logfile}))
    logger.warn(`Appending to an already existing logfile`);
  }
  if (address && (name || tokenName || tokenSymbol || params || founders)) {
    logger.warn(`DAO parameters specified for an existing DAO, ignoring.`);
  }
  logger.info(`Using network: ${network}, ${accounts.length} unlocked accounts`);
  logger.info(`Current account #${accounts.indexOf(web3.eth.defaultAccount)}: ${web3.eth.defaultAccount}`);

  function logTx(network: string, hash: string) {
    if (network.toLowerCase() === 'private') {
      logger.info(`   txHash: ${hash}`)
    } else {
      logger.info(`   https://${network !== 'live' ? network.toLowerCase() + '.' : ''}etherscan.io/tx/${hash}`)
    }
  }

  async function createDAO() {

    logger.info(`Creating DAO: {name='${name}',founders=${founders.map((x) => '#' + x.id)}}`);
    const dao = await Arc.DAO.new({
      name: `${name}-${Math.floor(Math.random() * 1000)}`,
      tokenName,
      tokenSymbol,
      founders: founders.map((x) => ({ address: accounts[x.id], tokens: Util.toWei(0), reputation: Util.toWei(x.reputation) })) as any,
      schemes: [
        { name: "SchemeRegistrar" },
        { name: "ContributionReward" },
        {
          name: "GenesisProtocol",
          ...params
        }
      ],
      votingMachineParams: {
        votingMachineName: "GenesisProtocol"
      }
    })

    logger.info(`   avatarAddress: ${dao.avatar.address}`);

    return dao;
  }

  try {
    let dao: DAO;
    if (address) {
      dao = await Arc.DAO.at(address);
      logger.info(`Fetched existing DAO from: ${address}`);
    } else {
      dao = await createDAO();
    }

    let daiAddress;
    if (network === Network.Private && dai) {
      logger.info(`Creating mock DAI token`);
      const daoToken = await Arc.StandardTokenFactory.new();
      daiAddress = daoToken.address
      logger.info(`   DAI address: ${daoToken.address}`);
    } else {
      daiAddress =
        network === Network.Mainnet ?
          '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359' : // mainnet DAI address
          '0xc4375b7de8af5a38a93548eb8453a498222c4ff2'; // Kovan DAI address
    }

    const avatarAddress = dao.avatar.address;
    const cr = (await dao.getSchemes('ContributionReward'))[0].wrapper as ContributionRewardWrapper;
    const gp = (await dao.getSchemes('GenesisProtocol'))[0].wrapper as GenesisProtocolWrapper;
    const stakingToken = await gp.getStakingToken();

    async function createProposal(options: CreateProposalOpts) {
      const { id, description, title, beneficiary, amount, reputation } = options;
      logger.info(`Creating proposal #${id}: {${dai ? `DAI` : 'ETH'}=${amount}, rep=${reputation}} -> ${beneficiary}`);

      const descriptionHash = Arc.Utils.SHA3(description);
      const submittedTime = Math.round((new Date()).getTime() / 1000);

      // Save the proposal title, description and submitted time on the server
      try {
        await axios.post(api + 'proposals', {
          daoAvatarAddress: avatarAddress,
          descriptionHash,
          description,
          submittedAt: submittedTime,
          title,
        });
      } catch (e) {
        logger.error(`Could not save proposal to server: ${e.message}`);
      }

      const tx = await cr.proposeContributionReward({
        title,
        avatar: avatarAddress,
        beneficiaryAddress: beneficiary,
        description,
        ethReward: dai ? 0 : Util.toWei(amount),
        externalToken: daiAddress,
        externalTokenReward: dai ? Util.toWei(amount) : 0,
        numberOfPeriods: 1,
        periodLength: 0,
        reputationChange: Util.toWei(reputation),
      } as any);
      logTx(network, tx.tx);
      const proposalId = await tx.getProposalIdFromMinedTx();
      logger.info(`   proposalId: ${proposalId}`)

      return proposalId;
    }

    async function vote(options: VoteOpts) {
      const { id, proposalId, vote } = options;
      logger.info(`Voting ${vote} on #${id}`);
      const { tx } = await gp.vote({
        proposalId,
        vote: vote == 'Yes' ? 1 : 2
      })
      logTx(network, tx);
    }

    async function stake(options: StakeOpts) {
      const { id, proposalId, vote, amount } = options;
      logger.info(`Staking ${vote} on #${id} with ${amount} GEN`);
      const { tx } = await gp.stake({
        proposalId,
        vote: vote == 'Yes' ? 1 : 2,
        amount: Util.toWei(amount)
      })
      logTx(network, tx);
    }

    async function approve() {
      logger.info(`Pre-approving 100000 GEN for current account`);
      const { tx } = await stakingToken.approve({ spender: gp.address, amount: Util.toWei(100000) });
      approved[web3.eth.defaultAccount] = true;
      logTx(network, tx);
    }
    await approve();

    for (i = 0; i < steps.length; i++) {
      const step = steps[i];
      switch (step.action) {
        case Action.SwitchAccount:
          const { id } = step.args;
          if (id < 0 || id >= accounts.length) {
            throw new Error(`Account id ${id} cannot be found (maximum id can be ${accounts.length - 1})`)
          }
          logger.info(`Switching to account #${id}: ${accounts[id]}`);
          web3.eth.defaultAccount = accounts[id];

          if (!approved[web3.eth.defaultAccount]) {
            await approve();
          }
          break;
        case Action.CreateProposal:
          if (proposalIds[step.args.id]) {
            throw new Error(`The id ${step.args.id} was already used for another proposal`)
          }
          const proposalId = await createProposal(step.args)
          proposalIds[step.args.id] = proposalId;
          break;
        case Action.Vote:
          if (!proposalIds[step.args.id]) {
            throw new Error(`No proposal with id ${step.args.id} was created`)
          }
          await vote({ ...step.args, proposalId: proposalIds[step.args.id] })
          break;
        case Action.Stake:
          if (!proposalIds[step.args.id]) {
            throw new Error(`No proposal with id ${step.args.id} was created`)
          }
          await stake({ ...step.args, proposalId: proposalIds[step.args.id] })
          break;
      }
    }
    logger.info('Done.');
    process.exit(0)
  } catch (e) {
    logger.error(`An error occured during script execution: ${e.stack}`);
    process.exit(1)
  }
}

const argv: any =
  yargs
    .config(
      'script',
      'path to a script file',
      (path) => JSON.parse(fs.readFileSync(path, 'utf-8'))
    )
    .option(
      'logfile', {
        alias: 'l',
        describe: 'path to a log file to save results',
        type: 'string'
      }
    )
    .option(
      'network', {
        alias: 'n',
        describe: 'network to use <mainnet|kovan|private>',
        default: 'kovan',
        type: 'string'
      }
    )
    .option(
      'mnemonic', {
        alias: 'm',
        describe: 'mnemonic from which to generate accounts',
        default: 'myth like bonus scare over problem client lizard pioneer submit female collect',
        type: 'string'
      }
    )
    .option(
      'dai', {
        alias: 'd',
        describe: 'DAI feature flag, use DAI instead of ETH when creating proposals',
        default: false,
        type: 'boolean'
      }
    )
    .argv

main(argv);
