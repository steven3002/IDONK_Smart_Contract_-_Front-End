import { legacy_createStore as createStore, applyMiddleware } from "redux";
import reducers from './reducers';
import { thunk } from "redux-thunk";
// import thunk from "redux-thunk";

const store = createStore(
    reducers,
    {},
    applyMiddleware(thunk)
);

export default store;