import createHistory from "history/createHashHistory";
import { routerMiddleware } from "react-router-redux";
import { applyMiddleware, compose, createStore } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import loggerMiddleware from "redux-logger";
import promiseMiddleware from "redux-promise-middleware";
import thunkMiddleware from "redux-thunk";

import reducers from "./reducers";

export const history = createHistory();

const store = createStore(
  reducers,
  composeWithDevTools(   // makes the store available to the Chrome redux dev tools
    applyMiddleware(
      thunkMiddleware,
      promiseMiddleware(),
      routerMiddleware(history),
      loggerMiddleware,
    ),
  ),
);

export default store;
