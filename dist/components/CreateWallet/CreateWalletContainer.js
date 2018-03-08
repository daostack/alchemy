"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const ReactDOM = require("react-dom");
const react_redux_1 = require("react-redux");
const arcActions = require("actions/arcActions");
const css = require("./CreateWallet.scss");
const mapStateToProps = (state, ownProps) => {
    return {
        web3: state.web3
    };
};
const mapDispatchToProps = {
    createWallet: arcActions.createWallet
};
class CreateWalletContainer extends React.Component {
    constructor(props) {
        super(props);
        this.handleSubmit = (event) => {
            event.preventDefault();
            this.props.createWallet(this.state.password);
            return false;
        };
        this.handleChange = (event) => {
            const newPassword = ReactDOM.findDOMNode(this.refs.passwordNode).value;
            this.setState({
                password: newPassword,
            });
        };
        this.state = {
            password: ""
        };
    }
    render() {
        return (React.createElement("div", { className: css.createWalletContainer },
            React.createElement("h2", null, "Create a Wallet"),
            React.createElement("form", { onSubmit: this.handleSubmit },
                React.createElement("label", { htmlFor: 'nameInput' }, "Password: "),
                React.createElement("input", { autoFocus: true, id: 'passwordInput', onChange: this.handleChange, ref: "passwordNode", required: true, type: "text", value: this.state.password }),
                React.createElement("button", { type: 'submit' }, "Submit"))));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(CreateWalletContainer);
//# sourceMappingURL=CreateWalletContainer.js.map