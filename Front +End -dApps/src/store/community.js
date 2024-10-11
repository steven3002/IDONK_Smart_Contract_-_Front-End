export const communityReducer = (state = [], action) => {
    switch (action.type) {
        case 'SET_COMMUNITY':
            return [...action.payload];
        case 'ADD_COMMUNITY':
            return [action.payload, ...state];
        default:
            return state;
    }
};

export const setCommunity = (data) => {
    return (dispatch) => {
        dispatch({
            type: 'SET_COMMUNITY',
            payload: data
        })
    }
};

export const addCommunity = (data) => {
    return (dispatch) => {
        dispatch({
            type: 'ADD_COMMUNITY',
            payload: data
        })
    }
};