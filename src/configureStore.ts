import createHistory from "history/createBrowserHistory";
import { routerMiddleware } from "react-router-redux";
import { applyMiddleware, createStore } from "redux";
import thunkMiddleware from "redux-thunk";

import { notificationUpdater, successDismisser } from "reducers/notifications";
import { operationsTracker } from "reducers/operations";
import { composeWithDevTools } from "redux-devtools-extension";
import { persistStore } from "redux-persist";
import reducers from "./reducers";

export const history = createHistory();

const store = createStore(
  reducers,
  // TODO: only compose with devtools in when ENV === 'dev'
  composeWithDevTools(   // makes the store available to the Chrome redux dev tools
    applyMiddleware(
      thunkMiddleware,
      operationsTracker,
      notificationUpdater,
      successDismisser(15000),
      routerMiddleware(history)
    ),
  ),
);

// A store for testing purposes
export const mockStore = () => createStore(
  reducers,
  applyMiddleware(
    thunkMiddleware,
    operationsTracker,
    notificationUpdater,
    successDismisser(15000),
    routerMiddleware(history),
  ),
);

persistStore(store);
export default store;
