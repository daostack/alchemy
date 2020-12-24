import { createBrowserHistory } from "history";
import { routerMiddleware } from "react-router-redux";
import { applyMiddleware, createStore } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import thunkMiddleware from "redux-thunk";
import reducers from "@store";

export const history = createBrowserHistory();

let store: any;
if (process.env.NODE_ENV === "production") {
  store = createStore(
    reducers,
    applyMiddleware(
      thunkMiddleware,
      routerMiddleware(history)
    ),
  );

} else {
  store = createStore(
    reducers,
    composeWithDevTools( // makes the store available to the Chrome redux dev tools
      applyMiddleware(
        thunkMiddleware,
        routerMiddleware(history)
      ),
    ),
  );

}

export default store;
