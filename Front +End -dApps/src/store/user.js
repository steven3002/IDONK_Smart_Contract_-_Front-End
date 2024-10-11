export const userReducer = (state = {}, action) => {
    switch (action.type) {
        case 'SET_USER':
            return { ...state, ...action.payload };
        default:
            return state;
    }
};

export const setUser = (data) => {
    return (dispatch) => {
        dispatch({
            type: 'SET_USER',
            payload: data
        })
    }
};