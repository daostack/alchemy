import { createBrowserHistory } from "history";
import { routerMiddleware } from "react-router-redux";
import { notificationUpdater, successDismisser } from "reducers/notifications";
import { operationsTracker } from "reducers/operations";
import { applyMiddleware, createStore } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import thunkMiddleware from "redux-thunk";
import reducers from "./reducers";

export const history = createBrowserHistory();

let store: any;
if (process.env.NODE_ENV === "production") {
  store = createStore(
    reducers,
    applyMiddleware(
      thunkMiddleware,
      operationsTracker,
      notificationUpdater,
      successDismisser(15000),
      routerMiddleware(history)
    ),
  );

} else {
  store = createStore(
    reducers,
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

}

export default store;
