export const walletReducer = (state = {}, action) => {
    switch (action.type) {
        case 'SET_WALLET':
            return { ...state, ...action.payload };
        default:
            return state;
    }
};

export const setWallet = (data) => {
    return (dispatch) => {
        dispatch({
            type: 'SET_WALLET',
            payload: data
        })
    }
};