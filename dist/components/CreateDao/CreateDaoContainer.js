"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const ReactDOM = require("react-dom");
const react_redux_1 = require("react-redux");
const arcActions = require("actions/arcActions");
const css = require("./CreateDao.scss");
const mapStateToProps = (state, ownProps) => {
    return {
        web3: state.web3
    };
};
const mapDispatchToProps = {
    createDAO: arcActions.createDAO
};
class CreateDaoContainer extends React.Component {
    constructor(props) {
        super(props);
        this.handleSubmit = (event) => {
            event.preventDefault();
            this.props.createDAO(this.state.name, this.state.tokenName, this.state.tokenSymbol, this.state.collaborators);
            return false;
        };
        this.handleChange = (event) => {
            const newName = ReactDOM.findDOMNode(this.refs.nameNode).value;
            const newTokenName = ReactDOM.findDOMNode(this.refs.tokenNode).value;
            const newTokenSymbol = ReactDOM.findDOMNode(this.refs.tokenSymbolNode).value;
            this.setState({
                name: newName,
                tokenName: newTokenName,
                tokenSymbol: newTokenSymbol
            });
        };
        this.handleChangeCollaboratorAddress = (index) => (event) => {
            const newCollaborators = this.state.collaborators.map((collaborator, sidx) => {
                if (index !== sidx)
                    return collaborator;
                return Object.assign({}, collaborator, { address: event.target.value });
            });
            this.setState({ collaborators: newCollaborators });
        };
        this.handleChangeCollaboratorTokens = (index) => (event) => {
            const newCollaborators = this.state.collaborators.map((collaborator, sidx) => {
                if (index !== sidx)
                    return collaborator;
                return Object.assign({}, collaborator, { tokens: event.target.value });
            });
            this.setState({ collaborators: newCollaborators });
        };
        this.handleChangeCollaboratorReputation = (index) => (event) => {
            const newCollaborators = this.state.collaborators.map((collaborator, sidx) => {
                if (index !== sidx)
                    return collaborator;
                return Object.assign({}, collaborator, { reputation: event.target.value });
            });
            this.setState({ collaborators: newCollaborators });
        };
        this.handleRemoveCollaborator = (index) => (event) => {
            if (this.state.collaborators.length === 1) {
                return;
            }
            this.setState({ collaborators: this.state.collaborators.filter((c, sidx) => index !== sidx) });
        };
        this.handleAddCollaborator = (event) => {
            this.setState({
                collaborators: this.state.collaborators.concat([{ address: '', tokens: 1000, reputation: 1000 }]),
            });
        };
        this.state = {
            name: "",
            tokenName: "",
            tokenSymbol: "",
            collaborators: [{ address: this.props.web3.ethAccountAddress, tokens: 1000, reputation: 1000 }]
        };
    }
    render() {
        return (React.createElement("div", { className: css.createDaoWrapper },
            React.createElement("h2", null, "Create Your DAO"),
            React.createElement("form", { onSubmit: this.handleSubmit },
                React.createElement("label", { htmlFor: 'nameInput' }, "Name: "),
                React.createElement("input", { autoFocus: true, id: 'nameInput', onChange: this.handleChange, placeholder: "Name your DAO", ref: "nameNode", required: true, type: "text", value: this.state.name }),
                React.createElement("br", null),
                React.createElement("label", { htmlFor: 'tokenInput' }, "Token: "),
                React.createElement("input", { id: 'tokenInput', onChange: this.handleChange, placeholder: "Choose a token name", ref: "tokenNode", required: true, type: "text", value: this.state.tokenName }),
                React.createElement("br", null),
                React.createElement("label", { htmlFor: 'tokenSymbolInput' }, "Token Symbol: "),
                React.createElement("input", { id: 'tokenSymbolInput', maxLength: 3, onChange: this.handleChange, placeholder: "Choose a three character token symbol", ref: "tokenSymbolNode", required: true, type: "text", value: this.state.tokenSymbol }),
                React.createElement("br", null),
                this.renderCollaborators(),
                React.createElement("button", { type: 'submit' }, "Submit"))));
    }
    renderCollaborators() {
        const collaboratorRows = this.state.collaborators.map((collaborator, index) => {
            return (React.createElement("div", { key: `collaborator_${index}_row_` },
                React.createElement("label", { htmlFor: `collaborator_${index}_address_input` }, "Member Address: "),
                React.createElement("input", { id: `collaborator_${index}_address_input`, maxLength: 42, minLength: 42, onChange: this.handleChangeCollaboratorAddress(index), placeholder: "0x0000000000000000000000000000000000000000", ref: `collaborator_${index}_address_input`, size: 46, type: 'string', value: collaborator.address }),
                React.createElement("label", { htmlFor: `collaborator_${index}_tokens_input` }, "Num Tokens: "),
                React.createElement("input", { id: `collaborator_${index}_tokens_input`, onChange: this.handleChangeCollaboratorTokens(index), ref: `collaborator_${index}_tokens_input`, placeholder: 'assign initial tokens', size: 10, type: 'string', value: collaborator.tokens }),
                React.createElement("label", { htmlFor: `collaborator_${index}_reputation_input` }, "Reputation: "),
                React.createElement("input", { id: `collaborator_${index}_reputation_input`, onChange: this.handleChangeCollaboratorReputation(index), placeholder: "assign initial reputation", ref: `collaborator_${index}_reputation_input`, size: 10, type: 'string', value: collaborator.reputation }),
                index > 0 ? React.createElement("button", { type: 'button', tabIndex: -1, onClick: this.handleRemoveCollaborator(index) }, "X") : ""));
        });
        return (React.createElement("div", { className: css.collaborators },
            React.createElement("h3", null, "DAO Members"),
            collaboratorRows,
            React.createElement("br", null),
            React.createElement("button", { type: 'button', onClick: this.handleAddCollaborator }, "Add Collaborator")));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(CreateDaoContainer);
//# sourceMappingURL=CreateDaoContainer.js.map