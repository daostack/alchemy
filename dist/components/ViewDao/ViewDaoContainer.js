"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const classNames = require("classnames");
const React = require("react");
const react_redux_1 = require("react-redux");
const react_router_dom_1 = require("react-router-dom");
const arcActions = require("actions/arcActions");
const css = require("./ViewDao.scss");
const mapStateToProps = (state, ownProps) => {
    return {
        dao: state.arc.daoList[ownProps.match.params.daoAddress],
        daoAddress: ownProps.match.params.daoAddress,
        web3: state.web3
    };
};
const mapDispatchToProps = {
    getDAO: arcActions.getDAO,
    voteOnProposition: arcActions.voteOnProposition
};
class ViewDaoContainer extends React.Component {
    constructor() {
        super(...arguments);
        this.handleClickVote = (proposalId, vote) => (event) => {
            this.props.voteOnProposition(this.props.daoAddress, proposalId, this.props.web3.ethAccountAddress, vote);
        };
    }
    componentDidMount() {
        this.props.getDAO(this.props.daoAddress);
    }
    render() {
        const { dao } = this.props;
        return (dao ?
            React.createElement("div", { className: css.wrapper },
                React.createElement("h1", null,
                    "Viewing Dao: ",
                    dao.name),
                React.createElement("div", null,
                    "Avatar address: ",
                    dao.avatarAddress),
                React.createElement("div", null,
                    "Token: ",
                    dao.tokenName,
                    " (",
                    dao.tokenSymbol,
                    ")"),
                React.createElement("div", null,
                    "Num tokens: ",
                    dao.tokenCount),
                React.createElement("div", null,
                    "Omega: ",
                    dao.reputationCount),
                this.renderMembers(),
                this.renderProposals(),
                React.createElement(react_router_dom_1.Link, { to: '/proposition/create/' + dao.avatarAddress }, "Create Proposition"))
            : React.createElement("div", null, "Loading... "));
    }
    renderMembers() {
        const { dao } = this.props;
        const membersHTML = dao.members.map((member, index) => {
            return (React.createElement("div", { className: css.member, key: "member_" + index },
                React.createElement("strong", null,
                    index + 1,
                    ": ",
                    member.address),
                React.createElement("br", null),
                "Tokens: ",
                React.createElement("span", null, member.tokens),
                React.createElement("br", null),
                "Reputation: ",
                React.createElement("span", null, member.reputation)));
        });
        return (React.createElement("div", { className: css.members },
            React.createElement("h2", null, "Members"),
            membersHTML));
    }
    renderProposals() {
        const { dao } = this.props;
        const proposalsHTML = Object.keys(dao.proposals).map((proposalAddress) => {
            const proposal = dao.proposals[proposalAddress];
            var proposalClass = classNames({
                [css.proposal]: true,
                [css.openProposal]: proposal.open,
                [css.failedProposal]: proposal.failed,
                [css.passedProposal]: proposal.passed,
            });
            return (React.createElement("div", { className: proposalClass, key: "proposal_" + proposalAddress },
                React.createElement("h3", null, proposal.description),
                "Token Reward: ",
                React.createElement("span", null, proposal.tokenReward),
                React.createElement("br", null),
                "Reputation Reward: ",
                React.createElement("span", null, proposal.reputationReward),
                React.createElement("br", null),
                "Beneficiary: ",
                React.createElement("span", null, proposal.beneficiary),
                React.createElement("br", null),
                proposal.open ?
                    React.createElement("div", null,
                        "Yes votes: ",
                        React.createElement("span", null, proposal.yesVotes),
                        React.createElement("br", null),
                        "No votes: ",
                        React.createElement("span", null, proposal.noVotes),
                        React.createElement("br", null),
                        "Abstain Votes: ",
                        React.createElement("span", null, proposal.abstainVotes),
                        React.createElement("br", null),
                        React.createElement("button", { onClick: this.handleClickVote(proposal.proposalId, 1) }, "Vote Yes"),
                        " -",
                        React.createElement("button", { onClick: this.handleClickVote(proposal.proposalId, 2) }, "Vote No"),
                        " -",
                        React.createElement("button", { onClick: this.handleClickVote(proposal.proposalId, 0) }, "Abstain"))
                    : proposal.passed ?
                        React.createElement("div", null, "Passed!")
                        : proposal.failed ?
                            React.createElement("div", null, "Failed to pass") : ""));
        });
        return (React.createElement("div", { className: css.members },
            React.createElement("h2", null, "Propositions"),
            proposalsHTML));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(ViewDaoContainer);
//# sourceMappingURL=ViewDaoContainer.js.map