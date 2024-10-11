export const sessionsReducer = (state = {}, action) => {
    switch (action.type) {
        case 'SET_SESSIONS':
            return { ...state, ...action.payload };
        default:
            return state;
    }
};

export const setSessions = (data) => {
    return (dispatch) => {
        dispatch({
            type: 'SET_SESSIONS',
            payload: data
        })
    }
};