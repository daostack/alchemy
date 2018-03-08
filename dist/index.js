"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const ReactDOM = require("react-dom");
const react_hot_loader_1 = require("react-hot-loader");
const App_1 = require("./App");
require("./assets/styles/global.scss");
function renderApp() {
    ReactDOM.render(React.createElement(react_hot_loader_1.AppContainer, null,
        React.createElement(App_1.App, null)), document.querySelector('#root'));
}
if (module.hot) {
    module.hot.accept();
    renderApp();
}
else {
    renderApp();
}
//# sourceMappingURL=index.js.map