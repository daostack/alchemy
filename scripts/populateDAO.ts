import * as yargs from 'yargs';
import chalk from 'chalk';
import * as moment from 'moment';
import * as fs from 'fs';
import * as Arc from '@daostack/arc.js';
import { VoteOptions, DAO } from '@daostack/arc.js';
import Util from '../src/lib/util';
import axios from "axios";
import { ContributionRewardWrapper, GenesisProtocolWrapper } from '@daostack/arc.js';
import HDWalletProvider from "../src/lib/truffle-hdwallet-provider";
// tslint:disable-next-line:no-var-requires
const Web3 = require("web3");
import promisify = require("es6-promisify");
// tslint:disable-next-line:no-var-requires
const NonceTrackerSubprovider = require("web3-provider-engine/subproviders/nonce-tracker");

// tslint:disable-next-line:no-var-requires
require('dotenv').config();

enum Level {
    Success = 'success',
    Info = 'info',
    Warn = 'warn',
    Error = 'error',
    Debug = 'debug'
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
    eth: number,
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
    {action: Action.SwitchAccount, args: SwitchAccountOpts} |
    {action: Action.CreateProposal, args: CreateProposalOpts} |
    {action: Action.Vote, args: VoteOpts} |
    {action: Action.Stake, args: StakeOpts};

interface Opts extends CreateDAOOpts {
    steps: Step[];
    api: string;
    network: string;
    logfile: string;
    mnemonic: string;
}

async function main(options: Opts) {
    const mapping: {[id: number]: string} = {};
    const approved: {[address: string]: boolean} = {};
    let i: number = 0;

    const { address, steps, api, network, mnemonic, logfile, params, name, tokenName, tokenSymbol, founders } = options;

    const infuraKey = process.env.INFURA_KEY;
    if (network !== 'private' && !infuraKey) {
        throw new Error('Please include a line `INFURA_KEY=...` in a .env file in the current directory');
    }
    const provider = new HDWalletProvider(mnemonic, network === 'private' ? 'http://localhost:8545' : `https://${network}.infura.io/` + infuraKey, 0, 10);

    // Needed to track nonces correctly https://ethereum.stackexchange.com/questions/44349/truffle-infura-on-mainnet-nonce-too-low-error
    const nonceTracker = new NonceTrackerSubprovider();
    provider.engine._providers.unshift(nonceTracker);
    nonceTracker.setEngine(provider.engine);

    (global as any).web3 = new Web3(provider.engine);

    await Arc.InitializeArcJs();
    const web3 = await Arc.Utils.getWeb3();

    const accounts = await promisify(web3.eth.getAccounts)()

    if (logfile && fs.existsSync(logfile)) {
        log(Level.Warn, `Appending to an already existing logfile`);
    }
    if (address && (name || tokenName || tokenSymbol || params || founders)) {
        log(Level.Warn, `DAO parameters specified for an existing DAO, ignoring.`);
    }
    log(Level.Info, `Using network: ${network}, ${accounts.length} unlocked accounts`);
    log(Level.Info, `Current account #${accounts.indexOf(web3.eth.defaultAccount)}: ${web3.eth.defaultAccount}`);

    function log(level: Level, msg: any) {
        const color = {
            [Level.Success]: 'green',
            [Level.Info]: 'gray',
            [Level.Warn]: 'yellow',
            [Level.Error]: 'red',
            [Level.Debug]: 'magenta'
        };

        console.info(chalk`{${color[level]} {bold ${moment().format("DD/MM/YYYY hh:mm:ss A")} ${level}}: ${typeof msg === 'string' ? msg : JSON.stringify(msg)}}`);

        if (logfile) {
            fs.appendFileSync(logfile, `${moment().format("DD/MM/YYYY hh:mm:ss A")} ${level}: ${typeof msg === 'string' ? msg : JSON.stringify(msg)}\n`, {encoding: 'utf-8'});
        }
    }

    function logTx(network: string, hash: string) {
        if (network.toLowerCase() === 'private') {
            log(Level.Info, `   txHash: ${hash}`)
        } else {
            log(Level.Info, `   https://${network !== 'live' ? network.toLowerCase() + '.' : ''}etherscan.io/tx/${hash}`)
        }
    }

    async function createDAO() {

        log(Level.Info, `Creating DAO: {name='${name}',founders=${founders.map((x) => '#' + x.id)}}`);
        const dao = await Arc.DAO.new({
            name: `${name}-${Math.floor(Math.random() * 1000)}`,
            tokenName,
            tokenSymbol,
            founders: founders.map((x) => ({address: accounts[x.id] , tokens: Util.toWei(0), reputation: Util.toWei(x.reputation)})) as any,
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

        log(Level.Info, `   avatarAddress: ${dao.avatar.address}`)

        return dao;
    }

    try {
        let dao: DAO;
        if (address) {
            dao = await Arc.DAO.at(address);
            log(Level.Info, `Fetched existing DAO from: ${address}`);
        } else {
            dao = await createDAO();
        }

        const avatarAddress = dao.avatar.address;
        const cr = (await dao.getSchemes('ContributionReward'))[0].wrapper as ContributionRewardWrapper;
        const gp = (await dao.getSchemes('GenesisProtocol'))[0].wrapper as GenesisProtocolWrapper;
        const stakingToken = await gp.getStakingToken();

        async function createProposal(options: CreateProposalOpts) {
            const { id, description, title, beneficiary, eth, reputation } = options;
            log(Level.Info, `Creating proposal #${id}: {eth=${eth}, rep=${reputation}} -> ${beneficiary}`);

            const descriptionHash = Arc.Utils.SHA3(description);
            const submittedTime = Math.round((new Date()).getTime() / 1000);

            // Save the proposal title, description and submitted time on the server
            try {
                await axios.post(api + "/api/proposals", {
                    daoAvatarAddress: avatarAddress,
                    descriptionHash,
                    description,
                    submittedAt: submittedTime,
                    title,
                });
            } catch (e) {
                log(Level.Error, `Could not save proposal to server: ${e.message}`);
            }

            const tx = await cr.proposeContributionReward({
                title,
                avatar: avatarAddress,
                beneficiaryAddress: beneficiary,
                description,
                ethReward: Util.toWei(eth),
                numberOfPeriods: 1,
                periodLength: 0,
                reputationChange: Util.toWei(reputation),
            } as any);
            logTx(network, tx.tx);
            const proposalId = await tx.getProposalIdFromMinedTx();
            log(Level.Info, `   proposalId: ${proposalId}`)

            return proposalId;
        }

        async function vote(options: VoteOpts) {
            const { id, proposalId, vote } = options;
            log(Level.Info, `Voting ${vote} on #${id}`);
            const {tx} = await gp.vote({
                proposalId,
                vote: vote == 'Yes' ? 1 : 2
            })
            logTx(network, tx);
        }

        async function stake(options: StakeOpts) {
            const { id, proposalId, vote, amount } = options;
            log(Level.Info, `Staking ${vote} on #${id} with ${amount} GEN`);
            const {tx} = await gp.stake({
                proposalId,
                vote: vote == 'Yes' ? 1 : 2,
                amount: Util.toWei(amount)
            })
            logTx(network, tx);
        }

        async function approve() {
            log(Level.Info, `Pre-approving 1000 GEN for current account`);
            const {tx} = await stakingToken.approve({spender: gp.address, amount: Util.toWei(1000)});
            approved[web3.eth.defaultAccount] = true;
            logTx(network, tx);
        }
        await approve();

        for (i = 0 ; i < steps.length; i++) {
            const step = steps[i];
            switch (step.action) {
                case Action.SwitchAccount:
                    const { id } = step.args;
                    if (id < 0 || id >= accounts.length) {
                        throw new Error(`Account id ${id} cannot be found (maximum id can be ${accounts.length - 1})`)
                    }
                    log(Level.Info, `Switching to account #${id}: ${accounts[id]}`);
                    web3.eth.defaultAccount = accounts[id];

                    if (!approved[web3.eth.defaultAccount]) {
                        await approve();
                    }
                    break;
                case Action.CreateProposal:
                    if (mapping[step.args.id]) {
                        throw new Error(`The id ${step.args.id} was already used for another proposal`)
                    }
                    const proposalId = await createProposal(step.args)
                    mapping[step.args.id] = proposalId;
                    break;
                case Action.Vote:
                    if (!mapping[step.args.id]) {
                        throw new Error(`No proposal with id ${step.args.id} was created`)
                    }
                    await vote({...step.args, proposalId: mapping[step.args.id]})
                    break;
                case Action.Stake:
                    if (!mapping[step.args.id]) {
                        throw new Error(`No proposal with id ${step.args.id} was created`)
                    }
                    await stake({...step.args, proposalId: mapping[step.args.id]})
                    break;
            }
        }
        log(Level.Success, 'Done.');
        process.exit(0)
    } catch (e) {
        log(Level.Error, `An error occured during script execution: ${e.stack}`);
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
            'api', {
                alias: 'a',
                describe: 'api root url',
                default: 'https://daostack-alchemy.herokuapp.com',
                type: 'string'
            }
        )
        .option(
            'network', {
                alias: 'n',
                describe: 'network to use',
                default: 'kovan',
                type: 'string'
            }
        )
        .option(
            'mnemonic', {
                alias: 'm',
                describe: 'mnemonic from which to generate accounts',
                default: 'behave pipe turkey animal voyage dial relief menu blush match jeans general',
                type: 'string'
            }
        )
        .argv

main(argv);
