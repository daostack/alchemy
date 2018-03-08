"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const ReactDOM = require("react-dom");
const react_redux_1 = require("react-redux");
const arcActions = require("actions/arcActions");
const css = require("./CreateProposition.scss");
const mapStateToProps = (state, ownProps) => {
    return {
        dao: state.arc.daoList[ownProps.match.params.daoAddress],
        daoAddress: ownProps.match.params.daoAddress,
        web3: state.web3
    };
};
const mapDispatchToProps = {
    createProposition: arcActions.createProposition
};
class CreatePropositionContainer extends React.Component {
    constructor(props) {
        super(props);
        this.handleSubmit = (event) => {
            event.preventDefault();
            this.props.createProposition(this.state.avatarAddress, this.state.description, this.state.nativeTokenReward, this.state.reputationReward, this.state.beneficiary);
        };
        this.handleChange = (event) => {
            const newDescription = ReactDOM.findDOMNode(this.refs.descriptionNode).value;
            const newNativeTokenReward = Number(ReactDOM.findDOMNode(this.refs.nativeTokenRewardNode).value);
            const newReputationReward = Number(ReactDOM.findDOMNode(this.refs.reputationRewardNode).value);
            const newBenificiary = ReactDOM.findDOMNode(this.refs.beneficiaryNode).value;
            this.setState({
                description: newDescription,
                nativeTokenReward: newNativeTokenReward,
                reputationReward: newReputationReward,
                beneficiary: newBenificiary
            });
        };
        this.state = {
            avatarAddress: this.props.daoAddress,
            description: "",
            nativeTokenReward: 0,
            reputationReward: 0,
            ethReward: 0,
            externalTokenAddress: null,
            externalTokenReward: 0,
            beneficiary: "",
        };
    }
    render() {
        return (React.createElement("div", { className: css.createPropositionWrapper },
            React.createElement("h2", null,
                "Create a Contribution Proposition for DAO ",
                React.createElement("i", null, this.props.dao.name)),
            React.createElement("form", { onSubmit: this.handleSubmit },
                React.createElement("label", { htmlFor: 'descriptionInput' }, "Description: "),
                React.createElement("input", { autoFocus: true, id: 'descriptionInput', onChange: this.handleChange, placeholder: "Describe your propsoal", ref: "descriptionNode", required: true, size: 100, type: "text", value: this.state.description }),
                React.createElement("br", null),
                React.createElement("br", null),
                React.createElement("label", { htmlFor: 'nativeTokenRewardInput' }, "Token reward: "),
                React.createElement("input", { id: 'nativeTokenRewardInput', maxLength: 10, onChange: this.handleChange, placeholder: "How many tokens to reward", ref: "nativeTokenRewardNode", required: true, size: 10, type: "text", value: this.state.nativeTokenReward }),
                React.createElement("br", null),
                React.createElement("br", null),
                React.createElement("label", { htmlFor: 'reputationRewardInput' }, "Omega reward: "),
                React.createElement("input", { id: 'reputationRewardInput', maxLength: 10, onChange: this.handleChange, placeholder: "How much reputation to reward", ref: "reputationRewardNode", required: true, size: 10, type: "text", value: this.state.reputationReward }),
                React.createElement("br", null),
                React.createElement("br", null),
                React.createElement("label", { htmlFor: 'beneficiaryInput' }, "Beneficiary: "),
                React.createElement("input", { id: 'beneficiaryInput', maxLength: 42, onChange: this.handleChange, placeholder: "Who to reward", ref: "beneficiaryNode", required: true, size: 46, type: "text", value: this.state.beneficiary }),
                React.createElement("br", null),
                React.createElement("br", null),
                React.createElement("button", { type: 'submit' }, "Submit"))));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(CreatePropositionContainer);
//# sourceMappingURL=CreatePropositionContainer.js.map