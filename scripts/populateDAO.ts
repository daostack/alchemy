import * as yargs from 'yargs';
import chalk from 'chalk';
import * as moment from 'moment';
import * as fs from 'fs';
import * as Arc from '@daostack/arc.js';
import { VoteOptions, DAO } from '@daostack/arc.js';
import Util from '../src/lib/util';
import axios from "axios";
import { ContributionRewardWrapper, GenesisProtocolWrapper } from '@daostack/arc.js';

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
    logfile: string;
}

async function main(options: Opts) {
    const mapping: {[id: number]: string} = {};
    const approved: {[address: string]: boolean} = {};
    let i: number = 0;

    const { steps, api, logfile, params, name, tokenName, tokenSymbol, founders } = options;

    await Arc.InitializeArcJs();
    const web3 = await Arc.Utils.getWeb3();
    const network = await Arc.Utils.getNetworkName();

    log(Level.Info, `Using network: ${network}, ${web3.eth.accounts.length} unlocked accounts`);
    log(Level.Info, `Current account #${web3.eth.accounts.indexOf(web3.eth.defaultAccount)}: ${web3.eth.defaultAccount}`);

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
        if (network.toLowerCase() === 'ganache') {
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
            founders: founders.map((x) => ({address: web3.eth.accounts[x.id] , tokens: Util.toWei(0), reputation: Util.toWei(x.reputation)})) as any,
            schemes: [
                { name: "SchemeRegistrar" },
                { name: "ContributionReward" },
                { name: "GenesisProtocol" }
            ],
            votingMachineParams: {
                votingMachineName: "GenesisProtocol",
                ...params
            }
        })

        return dao;
    }

    try {
        if (logfile && fs.existsSync(logfile)) {
            throw new Error(`Logfile ${logfile} already exists, please move or delete it before running the script`)
        }

        const dao = await createDAO();
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
                    if (id < 0 || id >= web3.eth.accounts.length) {
                        throw new Error(`Account id ${id} cannot be found (maximum id can be ${web3.eth.accounts.length - 1})`)
                    }
                    log(Level.Info, `Switching to account #${id}: ${web3.eth.accounts[id]}`);
                    web3.eth.defaultAccount = web3.eth.accounts[id];

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
    } catch (e) {
        log(Level.Error, `An error occured during script execution: ${e.stack}`);
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
            'l', {
                alias: 'logfile',
                describe: 'path to a log file to save results',
                type: 'string'
            }
        )
        .option(
            'api', {
                describe: 'api root url',
                default: 'https://daostack-alchemy.herokuapp.com',
                type: 'string'
            }
        )
        .argv

main(argv);
