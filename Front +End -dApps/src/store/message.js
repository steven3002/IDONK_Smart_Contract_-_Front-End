export const messageReducer = (state = {}, action) => {
    switch (action.type) {
        case 'SET_MESSAGE':
            return { ...action.payload };
        default:
            return state;
    }
};

export const setMessage = (data) => {
    return (dispatch) => {
        dispatch({
            type: 'SET_MESSAGE',
            payload: data
        })
    }
};