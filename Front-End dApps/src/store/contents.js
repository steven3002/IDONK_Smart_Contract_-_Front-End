export const contentsReducer = (state = [], action) => {
    switch (action.type) {
        case 'SET_CONTENTS':
            return [ ...action.payload ];
        case 'POST_CONTENT':
            return [ action.payload, ...state ];
        default:
            return state;
    }
};

export const setContents = (data) => {
    return (dispatch) => {
        dispatch({
            type: 'SET_CONTENTS',
            payload: data
        })
    }
};

export const postingContent = (data) => {
    return (dispatch) => {
        dispatch({
            type: 'POST_CONTENT',
            payload: data
        })
    }
};