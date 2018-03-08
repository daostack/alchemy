"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const react_router_dom_1 = require("react-router-dom");
const arcActions = require("actions/arcActions");
const CreateDaoContainer_1 = require("components/CreateDao/CreateDaoContainer");
const CreatePropositionContainer_1 = require("components/CreateProposition/CreatePropositionContainer");
const CreateWalletContainer_1 = require("components/CreateWallet/CreateWalletContainer");
const HeaderContainer_1 = require("layouts/HeaderContainer");
const HomeContainer_1 = require("components/Home/HomeContainer");
const ViewDaoContainer_1 = require("components/ViewDao/ViewDaoContainer");
const css = require("./App.scss");
const mapStateToProps = (state, ownProps) => ({
    arc: state.arc,
    web3: state.web3
});
const mapDispatchToProps = {
    connectToArc: arcActions.connectToArc
};
class AppContainer extends React.Component {
    constructor(props) {
        super(props);
    }
    componentDidMount() {
        this.props.connectToArc();
    }
    render() {
        const { web3 } = this.props;
        return ((web3.isConnected ?
            React.createElement("div", { className: css.wrapper },
                React.createElement(HeaderContainer_1.default, null),
                React.createElement(react_router_dom_1.Switch, null,
                    React.createElement(react_router_dom_1.Route, { exact: true, path: "/", component: HomeContainer_1.default }),
                    React.createElement(react_router_dom_1.Route, { exact: true, path: "/dao/create", component: CreateDaoContainer_1.default }),
                    React.createElement(react_router_dom_1.Route, { path: "/dao/:daoAddress", component: ViewDaoContainer_1.default }),
                    React.createElement(react_router_dom_1.Route, { path: "/proposition/create/:daoAddress", component: CreatePropositionContainer_1.default }),
                    React.createElement(react_router_dom_1.Route, { path: "/wallet/create", component: CreateWalletContainer_1.default })))
            : React.createElement("div", null, "Loading...")));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(AppContainer);
//# sourceMappingURL=AppContainer.js.map