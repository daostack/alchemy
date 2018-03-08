"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const react_router_dom_1 = require("react-router-dom");
const DaoList_1 = require("components/DaoList/DaoList");
const arcActions = require("actions/arcActions");
const css = require("./Home.scss");
const mapStateToProps = (state, ownProps) => ({
    arc: state.arc,
});
const mapDispatchToProps = {
    getDAOList: arcActions.getDAOList
};
class HomeContainer extends React.Component {
    render() {
        return (React.createElement("div", { className: css.homeWrapper },
            React.createElement(DaoList_1.default, { daoList: this.props.arc.daoList, getDAOList: this.props.getDAOList }),
            React.createElement(react_router_dom_1.Link, { to: '/dao/create' }, "Create a New DAO")));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(HomeContainer);
//# sourceMappingURL=HomeContainer.js.map