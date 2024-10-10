import { combineReducers } from "redux";
import { userReducer } from './user';
import { contractReducer } from "./contract";
import { walletReducer } from './wallet';
import { communityReducer } from './community';
import { contentsReducer } from './contents';
import { messageReducer } from "./message";
import { sessionsReducer } from "./sessions";

const reducers = combineReducers({
    user: userReducer,
    sessions: sessionsReducer,
    contract: contractReducer,
    wallet: walletReducer,
    community: communityReducer,
    contents: contentsReducer,
    message: messageReducer
});

export default reducers;