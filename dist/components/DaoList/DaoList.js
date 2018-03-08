"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_router_dom_1 = require("react-router-dom");
const css = require("./DaoList.scss");
class DaoList extends React.Component {
    componentDidMount() {
        this.props.getDAOList();
    }
    render() {
        const { daoList } = this.props;
        const daoNodes = Object.keys(daoList).map((key) => {
            const dao = daoList[key];
            return (React.createElement("div", { key: "dao_" + dao.avatarAddress, className: css.dao },
                React.createElement(react_router_dom_1.Link, { to: "/dao/" + dao.avatarAddress },
                    React.createElement("h3", null, dao.name)),
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
                    dao.reputationCount)));
        });
        return (React.createElement("div", { className: css.wrapper },
            React.createElement("h2", null, "Your DAOs"),
            daoNodes ? daoNodes : "None"));
    }
}
exports.default = DaoList;
//# sourceMappingURL=DaoList.js.map