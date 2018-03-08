"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const react_router_dom_1 = require("react-router-dom");
const react_router_redux_1 = require("react-router-redux");
const configureStore_1 = require("./configureStore");
const AppContainer_1 = require("layouts/AppContainer");
class App extends React.Component {
    render() {
        return (React.createElement(react_redux_1.Provider, { store: configureStore_1.default },
            React.createElement(react_router_redux_1.ConnectedRouter, { history: configureStore_1.history },
                React.createElement(react_router_dom_1.Route, { path: "/", component: AppContainer_1.default }))));
    }
}
exports.App = App;
//# sourceMappingURL=App.js.map