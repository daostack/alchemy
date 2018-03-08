"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createHashHistory_1 = require("history/createHashHistory");
const react_router_redux_1 = require("react-router-redux");
const redux_1 = require("redux");
const redux_devtools_extension_1 = require("redux-devtools-extension");
const redux_logger_1 = require("redux-logger");
const redux_promise_middleware_1 = require("redux-promise-middleware");
const redux_thunk_1 = require("redux-thunk");
const reducers_1 = require("./reducers");
exports.history = createHashHistory_1.default();
const store = redux_1.createStore(reducers_1.default, redux_devtools_extension_1.composeWithDevTools(// makes the store available to the Chrome redux dev tools
redux_1.applyMiddleware(redux_thunk_1.default, redux_promise_middleware_1.default(), react_router_redux_1.routerMiddleware(exports.history), redux_logger_1.default)));
exports.default = store;
//# sourceMappingURL=configureStore.js.map