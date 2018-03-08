"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Arc = require("daostack-arc-js");
const promisify = require("es6-promisify");
const react_router_redux_1 = require("react-router-redux");
const web3Actions = require("actions/web3Actions");
const arcConstants = require("constants/arcConstants");
function connectToArc() {
    return (dispatch) => {
        dispatch(web3Actions.initializeWeb3()).then((results) => {
            dispatch(getArcAdresses(results.payload.instance));
        });
    };
}
exports.connectToArc = connectToArc;
function getArcAdresses(web3) {
    return (dispatch, getState) => __awaiter(this, void 0, void 0, function* () {
        dispatch({ type: arcConstants.ARC_INITIALIZATION_PENDING, payload: null });
        let arcContracts = yield Arc.getDeployedContracts();
        let payload = {
            genesisAddress: arcContracts.allContracts['GenesisScheme'].address
        };
        if (web3 != null) {
            web3.version.getNetwork((err, currentNetworkId) => {
                if (err) {
                    dispatch({ type: arcConstants.ARC_INITIALIZATION_REJECTED, payload: null });
                    return;
                }
            });
            dispatch({ type: arcConstants.ARC_INITIALIZATION_FULFILLED, payload: payload });
        }
        else {
            dispatch({ type: arcConstants.ARC_INITIALIZATION_REJECTED, payload: "Failed to get arc addresses, don't know why" });
        }
    });
}
exports.getArcAdresses = getArcAdresses;
function getDAOList() {
    return (dispatch, getState) => __awaiter(this, void 0, void 0, function* () {
        dispatch({ type: arcConstants.ARC_GET_DAOS_PENDING, payload: null });
        const web3 = getState().web3.instance;
        let arcContracts = yield Arc.getDeployedContracts();
        const genesisContract = yield Arc.requireContract("GenesisScheme");
        const genesisInstance = yield genesisContract.deployed();
        // Get the list of orgs we populated on the blockchain during genesis by looking for NewOrg events
        const newOrgEvents = genesisInstance.NewOrg({}, { fromBlock: 0 });
        newOrgEvents.get((err, eventsArray) => __awaiter(this, void 0, void 0, function* () {
            if (err) {
                dispatch({ type: arcConstants.ARC_GET_DAOS_REJECTED, payload: "Error getting new orgs from genesis contract: " + err.message });
            }
            let orgs = {};
            for (let index = 0; index < eventsArray.length; index++) {
                const event = eventsArray[index];
                orgs[event.args._avatar] = yield getDAOData(event.args._avatar, web3);
            }
            dispatch({ type: arcConstants.ARC_GET_DAOS_FULFILLED, payload: orgs });
        }));
    });
}
exports.getDAOList = getDAOList;
function getDAO(avatarAddress) {
    return (dispatch, getState) => __awaiter(this, void 0, void 0, function* () {
        dispatch({ type: arcConstants.ARC_GET_DAO_PENDING, payload: null });
        const web3 = getState().web3.instance;
        const daoData = yield getDAOData(avatarAddress, web3, true);
        dispatch({ type: arcConstants.ARC_GET_DAO_FULFILLED, payload: daoData });
    });
}
exports.getDAO = getDAO;
function getDAOData(avatarAddress, web3, detailed = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const org = yield Arc.Organization.at(avatarAddress);
        let orgData = {
            avatarAddress: avatarAddress,
            controllerAddress: "",
            name: web3.bytes32ToUtf8(yield org.getName()),
            members: [],
            rank: 1,
            promotedAmount: 0,
            proposals: {},
            reputationAddress: yield org.controller.nativeReputation(),
            reputationCount: Number(web3.fromWei(yield org.reputation.totalSupply(), "ether")),
            tokenAddress: yield org.controller.nativeToken(),
            tokenCount: Number(web3.fromWei(yield org.token.totalSupply(), "ether")),
            tokenName: yield org.getTokenName(),
            tokenSymbol: yield org.getTokenSymbol(),
        };
        if (detailed) {
            // Get all collaborators
            const mintTokenEvents = org.token.Mint({}, { fromBlock: 0 });
            const transferTokenEvents = org.token.Transfer({}, { fromBlock: 0 });
            const mintReputationEvents = org.reputation.Mint({}, { fromBlock: 0 });
            let collaboratorAddresses = [];
            const getMintTokenEvents = promisify(mintTokenEvents.get.bind(mintTokenEvents));
            let eventsArray = yield getMintTokenEvents();
            for (let cnt = 0; cnt < eventsArray.length; cnt++) {
                collaboratorAddresses.push(eventsArray[cnt].args.to);
            }
            const getTransferTokenEvents = promisify(transferTokenEvents.get.bind(transferTokenEvents));
            eventsArray = yield getTransferTokenEvents();
            for (let cnt = 0; cnt < eventsArray.length; cnt++) {
                collaboratorAddresses.push(eventsArray[cnt].args.to);
            }
            const getMintReputationEvents = promisify(mintReputationEvents.get.bind(mintReputationEvents));
            eventsArray = yield getMintReputationEvents();
            for (let cnt = 0; cnt < eventsArray.length; cnt++) {
                collaboratorAddresses.push(eventsArray[cnt].args.to);
            }
            collaboratorAddresses = [...new Set(collaboratorAddresses)]; // Dedupe
            let collaborators = [];
            for (let cnt = 0; cnt < collaboratorAddresses.length; cnt++) {
                const address = collaboratorAddresses[cnt];
                let collaborator = { address: address, tokens: 0, reputation: 0 };
                const tokens = yield org.token.balanceOf.call(address);
                collaborator.tokens = Number(web3.fromWei(tokens, "ether"));
                const reputation = yield org.token.reputationOf.call(address);
                collaborator.reputation = Number(web3.fromWei(reputation, "ether"));
                collaborators.push(collaborator);
            }
            orgData.members = collaborators;
            // Get proposals
            const votingMachineInstance = org.votingMachine;
            const contributionRewardInstance = yield Arc.ContributionReward.deployed();
            const newProposalEvents = contributionRewardInstance.LogNewContributionProposal({}, { fromBlock: 0 });
            const getNewProposalEvents = promisify(newProposalEvents.get.bind(newProposalEvents));
            const allProposals = yield getNewProposalEvents();
            const executedProposalEvents = contributionRewardInstance.LogProposalExecuted({}, { fromBlock: 0 });
            const getExecutedProposalEvents = promisify(executedProposalEvents.get.bind(executedProposalEvents));
            const executedProposals = yield getExecutedProposalEvents();
            const executedProposalIds = executedProposals.map((proposal) => proposal.args._proposalId);
            const failedProposalEvents = contributionRewardInstance.LogProposalDeleted({}, { fromBlock: 0 });
            const getFailedProposalEvents = promisify(failedProposalEvents.get.bind(failedProposalEvents));
            const failedProposals = yield getFailedProposalEvents();
            const failedProposalIds = failedProposals.map((proposal) => proposal.args._proposalId);
            let proposalArgs;
            for (let cnt = 0; cnt < allProposals.length; cnt++) {
                proposalArgs = allProposals[cnt].args;
                if (proposalArgs._avatar == org.avatar.address) {
                    let proposal = {
                        abstainVotes: 0,
                        beneficiary: proposalArgs._beneficiary,
                        description: proposalArgs._contributionDesciption,
                        failed: false,
                        noVotes: 0,
                        open: true,
                        passed: false,
                        proposalId: proposalArgs._proposalId,
                        reputationReward: Number(web3.fromWei(proposalArgs._reputationReward, "ether")),
                        tokenReward: Number(web3.fromWei(proposalArgs._nativeTokenReward, "ether")),
                        yesVotes: 0
                    };
                    if (executedProposalIds.includes(proposalArgs._proposalId)) {
                        proposal.passed = true;
                        proposal.open = false;
                    }
                    else if (failedProposalIds.includes(proposalArgs._proposalId)) {
                        proposal.failed = true;
                        proposal.open = false;
                    }
                    else {
                        const proposalStatus = yield votingMachineInstance.proposalStatus(proposalArgs._proposalId);
                        proposal.abstainVotes = Number(web3.fromWei(proposalStatus[0], "ether"));
                        proposal.yesVotes = Number(web3.fromWei(proposalStatus[1], "ether"));
                        proposal.noVotes = Number(web3.fromWei(proposalStatus[2], "ether"));
                    }
                    ;
                    orgData.proposals[proposalArgs._proposalId] = proposal;
                }
            }
        }
        return orgData;
    });
}
exports.getDAOData = getDAOData;
function createDAO(orgName, tokenName, tokenSymbol, collaborators) {
    return (dispatch, getState) => __awaiter(this, void 0, void 0, function* () {
        dispatch({ type: arcConstants.ARC_CREATE_DAO_PENDING, payload: null });
        try {
            const web3 = getState().web3.instance;
            let founders = [], collaborator;
            collaborators.sort((a, b) => {
                b.reputation - a.reputation;
            });
            for (let i = 0; i < collaborators.length; i++) {
                collaborator = collaborators[i];
                founders[i] = {
                    address: collaborator.address,
                    tokens: web3.toWei(collaborator.tokens, "ether"),
                    reputation: web3.toWei(collaborator.reputation, "ether")
                };
            }
            let schemes = [{
                    name: "ContributionReward"
                }];
            let org = yield Arc.Organization.new({
                orgName: orgName,
                tokenName: tokenName,
                tokenSymbol: tokenSymbol,
                founders: founders,
                schemes: schemes
            });
            let orgData = {
                avatarAddress: org.avatar.address,
                controllerAddress: org.controller.address,
                name: orgName,
                members: [],
                rank: 1,
                promotedAmount: 0,
                proposals: {},
                reputationAddress: org.reputation.address,
                reputationCount: 0,
                tokenAddress: org.token.address,
                tokenCount: 0,
                tokenName: tokenName,
                tokenSymbol: tokenSymbol
            };
            dispatch({ type: arcConstants.ARC_CREATE_DAO_FULFILLED, payload: orgData });
            dispatch(react_router_redux_1.push('/dao/' + org.avatar.address));
        }
        catch (err) {
            dispatch({ type: arcConstants.ARC_CREATE_DAO_REJECTED, payload: err.message });
        }
    }); /* EO createDAO */
}
exports.createDAO = createDAO;
function createProposition(orgAvatarAddress, description, nativeTokenReward, reputationReward, beneficiary) {
    return (dispatch, getState) => __awaiter(this, void 0, void 0, function* () {
        dispatch({ type: arcConstants.ARC_CREATE_PROPOSITION_PENDING, payload: null });
        try {
            const web3 = getState().web3.instance;
            const ethAccountAddress = getState().web3.ethAccountAddress;
            const ContributionRewardContract = yield Arc.requireContract("ContributionReward");
            const contributionRewardInstance = yield ContributionRewardContract.deployed();
            const submitProposalTransaction = yield contributionRewardInstance.submitContribution(orgAvatarAddress, description, web3.toWei(nativeTokenReward, "ether"), // uint _nativeTokenReward,
            web3.toWei(reputationReward, "ether"), // uint _reputationReward,
            0, // uint _ethReward,
            '0x0008e8314d3f08fd072e06b6253d62ed526038a0', // StandardToken _externalToken, we provide some arbitrary address
            0, // uint _externalTokenReward,
            beneficiary, // address _beneficiary
            { from: beneficiary, gas: 4000000 });
            const proposal = {
                abstainVotes: 0,
                beneficiary: beneficiary,
                description: description,
                failed: false,
                noVotes: 0,
                open: true,
                orgAvatarAddress: orgAvatarAddress,
                passed: false,
                proposalId: submitProposalTransaction.logs[0].args._proposalId,
                reputationReward: reputationReward,
                tokenReward: nativeTokenReward,
                yesVotes: 0,
            };
            dispatch({ type: arcConstants.ARC_CREATE_PROPOSITION_FULFILLED, payload: proposal });
            dispatch(react_router_redux_1.push('/dao/' + orgAvatarAddress));
        }
        catch (err) {
            dispatch({ type: arcConstants.ARC_CREATE_PROPOSITION_REJECTED, payload: err.message });
        }
    });
}
exports.createProposition = createProposition;
function voteOnProposition(orgAvatarAddress, proposalId, voterAddress, vote) {
    return (dispatch, getState) => __awaiter(this, void 0, void 0, function* () {
        dispatch({ type: arcConstants.ARC_VOTE_PENDING, payload: null });
        try {
            const web3 = getState().web3.instance;
            const ethAccountAddress = getState().web3.ethAccountAddress;
            const AbsoluteVoteContract = yield Arc.requireContract("AbsoluteVote");
            const votingMachineInstance = yield AbsoluteVoteContract.deployed();
            const voteTransaction = yield votingMachineInstance.vote(proposalId, vote, { from: ethAccountAddress, gas: 4000000 });
            const proposalStatus = yield votingMachineInstance.proposalStatus(proposalId);
            let payload = {
                abstainVotes: Number(web3.fromWei(proposalStatus[0], "ether")),
                failed: false,
                noVotes: Number(web3.fromWei(proposalStatus[2], "ether")),
                orgAvatarAddress: orgAvatarAddress,
                open: true,
                passed: false,
                proposalId: proposalId,
                yesVotes: Number(web3.fromWei(proposalStatus[1], "ether"))
            };
            // See if the proposition was executed, either passing or failing
            const executed = voteTransaction.logs.find((log) => log.event == "LogExecuteProposal");
            if (executed) {
                const decision = executed.args._decision.toNumber();
                payload.open = false;
                if (decision == 1) {
                    payload.passed = true;
                }
                else if (decision == 2) {
                    payload.failed = true;
                }
                else {
                    dispatch({ type: arcConstants.ARC_VOTE_REJECTED, payload: "Unknown proposition decision ", decision });
                    return;
                }
            }
            dispatch({ type: arcConstants.ARC_VOTE_FULFILLED, payload: payload });
        }
        catch (err) {
            dispatch({ type: arcConstants.ARC_VOTE_REJECTED, payload: err.message });
        }
    });
}
exports.voteOnProposition = voteOnProposition;
function createWallet(password) {
    return (dispatch, getState) => __awaiter(this, void 0, void 0, function* () {
        var wallet = Arc.Wallet.new();
    });
}
exports.createWallet = createWallet;
//# sourceMappingURL=arcActions.js.map