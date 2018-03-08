"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const ReactDOM = require("react-dom");
const react_router_dom_1 = require("react-router-dom");
const react_redux_1 = require("react-redux");
const web3Actions = require("actions/web3Actions");
const EthBalance_1 = require("components/EthBalance/EthBalance");
const css = require("./App.scss");
const mapStateToProps = (state, ownProps) => {
    return {
        web3: state.web3
    };
};
const mapDispatchToProps = {
    changeAccount: web3Actions.changeAccount
};
class HeaderContainer extends React.Component {
    constructor() {
        super(...arguments);
        this.handleChangeAccount = (e) => {
            const newAddress = ReactDOM.findDOMNode(this.refs.accountSelectNode).value;
            this.props.changeAccount(newAddress);
        };
    }
    render() {
        const { web3 } = this.props;
        const accountOptionNodes = web3.instance.eth.accounts.map((account) => (React.createElement("option", { key: 'account_' + account, selected: account == web3.ethAccountAddress }, account)));
        return (React.createElement("nav", { className: css.header },
            React.createElement(react_router_dom_1.Link, { to: '/' },
                React.createElement("img", { src: '/assets/images/Emergent+-+White@2x.png', height: '100' })),
            React.createElement("h1", null, "Welcome to the Emergent ecosystem"),
            web3
                ? React.createElement("div", { className: css.accountInfo },
                    React.createElement("span", null, "Current account:"),
                    React.createElement("select", { onChange: this.handleChangeAccount, ref: 'accountSelectNode' }, accountOptionNodes),
                    "\u00A0-\u00A0",
                    React.createElement("span", { className: css.etherBalance },
                        "Ether Balance ",
                        React.createElement(EthBalance_1.default, { ethAccountBalance: web3.ethAccountBalance, ethAccountAddress: web3.ethAccountAddress }),
                        " "))
                : ""));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(HeaderContainer);
//# sourceMappingURL=HeaderContainer.js.map