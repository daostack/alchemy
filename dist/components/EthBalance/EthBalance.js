"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const css = require("./EthBalance.scss");
class EthBalance extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        const { ethAccountBalance } = this.props;
        // <EtherscanLink address={ ethAddress } >{ ethBalance } ETH</EtherscanLink>
        return (React.createElement("span", { className: css.accountBalance },
            ethAccountBalance,
            " ETH"));
    }
}
exports.default = EthBalance;
//# sourceMappingURL=EthBalance.js.map