import { combineReducers } from 'redux';

class PlayerState {
  constructor () {
    this.volume = 50;
    this.position = 0;
    this.duration = 0;
    this.track = {};
  }
}

export default combineReducers({
  playerDeviceId: (state = null, action) => {
    switch(action.type) {
      case 'PLAYER_DEVICE_ID':
        return action.id;
    }
    return state;
  },
  player: (state = new PlayerState, action) => {
    switch(action.type) {
      case 'PLAYER_STATE':
        const data = action.data;
        state = new PlayerState;
        state.position = data.position;
        state.duration = data.duration;
        state.track = data.track_window.current_track;
        return state;
    }
    return state;
  },
  albumId: (state = null, action) => {
    switch (action.type) {
      case 'LOAD_ALBUM':
        return action.id;
      default:
        return state;
    }
  },
  tracks: (state = [], action) => {
    switch (action.type) {
      case 'TRACKS':
        return action.tracks;
      default:
        return state;
    }
  }
});
