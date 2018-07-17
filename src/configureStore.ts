import createHistory from "history/createHashHistory";
import { routerMiddleware } from "react-router-redux";
import { applyMiddleware, compose, createStore } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import loggerMiddleware from "redux-logger";
import promiseMiddleware from "redux-promise-middleware";
import thunkMiddleware from "redux-thunk";

import reducers from "./reducers";
import { operationsTracker } from "reducers/operations";
import { successDismisser, notificationUpdater } from "reducers/notifications";
import { persistStore, createTransform } from 'redux-persist';

export const history = createHistory();

const middlewares = [
  operationsTracker,
  notificationUpdater,
  successDismisser(),
  thunkMiddleware,
  promiseMiddleware(),
  routerMiddleware(history),
]

const store = createStore(
  reducers,
  process.env.NODE_ENV === 'development' ?
    composeWithDevTools(   // makes the store available to the Chrome redux dev tools
      applyMiddleware(
        ...middlewares,
        loggerMiddleware,
      ),
    ) :
    applyMiddleware(
      ...middlewares
    )
);

const persistor = persistStore(store);

export default store;
