import React               from 'react';
import ReactDOM            from 'react-dom';
import axios               from 'axios';
import router              from './router.jsx';
import player              from './player';
import { Provider }        from 'react-redux';
import { createStore }     from 'redux';
import reducers            from './reducers';

let store = createStore(reducers);

function render(state) {
  ReactDOM.render(
    <Provider store={store}>{router(state)}</Provider>,
    document.getElementById('layout')
  );
}

render({tracks: [], authentication:{}});

axios({
  method: 'get',
  url: 'http://localhost:3000/init',
  withCredentials: true
}).then(response => {

  const data = response.data;
  const loggedIn = data.access_token ? true : false;
  const state = {
    tracks: [],
    authentication: {
      loggedIn: loggedIn,
      accessToken: data.access_token
    }
  };

  player.init(
    data.access_token,
    callback => axios({
      method: 'get',
      url: 'http://localhost:3000/token',
      withCredentials: true
    }).then(res => {
      callback(res.data.access_token);
    }),
    (event, data) => {
      switch (event) {
        case 'deviceId': store.dispatch({
          type: 'PLAYER_DEVICE_ID',
          id: data
        });
        case 'state': store.dispatch({
          type: 'PLAYER_STATE',
          data: data
        });
      }
    }
  );

  render(state);

  axios({
    method: 'get',
    url: 'http://localhost:3000/api/tracks',
    withCredentials: true
  }).then(res => {
    const tracks = state.tracks = res.data;
    store.dispatch({type: 'TRACKS', tracks});
    render(state);
  });
});
