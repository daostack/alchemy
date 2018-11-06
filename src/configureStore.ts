import createHistory from "history/createBrowserHistory";
import { routerMiddleware } from "react-router-redux";
import { applyMiddleware, compose, createStore } from "redux";
import thunkMiddleware from "redux-thunk";

import reducers from "./reducers";
import { operationsTracker } from "reducers/operations";
import { successDismisser, notificationUpdater } from "reducers/notifications";
import { persistStore, createTransform } from 'redux-persist';

export const history = createHistory();

let store: any

if (process.env.NODE_ENV === 'development') {
  // require these modules only in developmetn, to save some space in the bundle
  const composeWithDevTools = require('redux-devtools-extension').composeWithDevTools
  const loggerMiddleware = require("redux-logger")
  store = createStore(
    reducers,
    composeWithDevTools(   // makes the store available to the Chrome redux dev tools
      applyMiddleware(
        operationsTracker,
        notificationUpdater,
        successDismisser(15000),
        thunkMiddleware,
        routerMiddleware(history),
        loggerMiddleware,
      ),
    ),
  );
} else {
  store = createStore(
    reducers,
    applyMiddleware(
      operationsTracker,
      notificationUpdater,
      successDismisser(15000),
      thunkMiddleware,
      routerMiddleware(history),
    ),
  )
}
const persistor = persistStore(store);
export default store;
