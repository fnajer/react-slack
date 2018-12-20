import * as actionTypes from '../actions/types';
import { combineReducers } from 'redux';

const initialUserState = {
  currentUser: null,
  isLoading: true,
};

const userReducer = (state = initialUserState, action) => {
  switch (action.type) {
    case actionTypes.SET_USER:
      return {
        currentUser: action.payload.currentUser,
        isLoading: false,
      };
    case actionTypes.CLEAR_USER:
      return {
        currentUser: null,
        isLoading: false,
      };
    default:
      return state;
  }
}

const initialChannelState = {
  currentChannel: null,
};

const channelReducer = (state = initialChannelState, action) => {
  switch (action.type) {
    case actionTypes.SET_CURRENT_CHANNEL:
      return {
        currentChannel: action.payload.currentChannel,
      };
    default:
      return state;
  }
}

const rootReducer = combineReducers({
  user: userReducer,
  channel: channelReducer,
});

export default rootReducer;