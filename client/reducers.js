import { combineReducers } from 'redux';

class PlayerState {
  constructor (
    volume   = 50,
    position = 0,
    duration = 0,
    track    = {},
    paused   = true,
  ) {
    this.volume   = volume;
    this.position = position;
    this.duration = duration;
    this.track    = track;
    this.paused   = paused;
  }
}

PlayerState.fromState = ({volume, position, duration, track, paused}) =>
  new PlayerState(volume, position, duration, track, paused);

export default combineReducers({
  authentication: (state = {}, action) => {
    switch(action.type) {
      case 'AUTHENTICATION': return action.authentication;
    }
    return state;
  },
  jobProgress: (state = null, action) => {
    switch(action.type) {
      case 'JOB_PROGRESS': return action.jobProgress;
    }
    return state;
  },
  job: (state = null, action) => {
    switch(action.type) {
      case 'JOB': return action.job;
    }
    return state;
  },
  playerDeviceId: (state = null, action) => {
    switch(action.type) {
      case 'PLAYER_DEVICE_ID':
        return action.id;
    }
    return state;
  },
  player: (state = new PlayerState, action) => {
    switch(action.type) {
      case 'PLAYER_SEEK':
        console.log(state.track);
        state = PlayerState.fromState(state);
        state.position = action.data;
        return state;
      case 'PLAYER_TOGGLE':
        state = PlayerState.fromState(state);
        state.paused = !state.paused;
        return state;
      case 'PLAYER_STATE':
        const data = action.data;
        state = PlayerState.fromState(state);
        state.position = data.position;
        state.duration = data.duration;
        state.paused   = data.paused;
        state.track    = data.track_window.current_track || null;
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
