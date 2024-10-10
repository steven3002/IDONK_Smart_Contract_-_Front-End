export const contractReducer = (state = {}, action) => {
    switch (action.type) {
        case 'SET_CONTRACT':
            return { ...state, ...action.payload };
        default:
            return state;
    }
};

export const setContract = (data) => {
    return (dispatch) => {
        dispatch({
            type: 'SET_CONTRACT',
            payload: data
        })
    }
};