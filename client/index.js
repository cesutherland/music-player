import React        from 'react';
import ReactDOM     from 'react-dom';
import { Provider } from 'react-redux';
import axios        from 'axios';
import socket       from 'socket.io-client';
import router       from './router.jsx';
import player       from './player';
import store        from './store';
import { api }      from '../config';

function render(state) {
  ReactDOM.render(
    <Provider store={store}>{router(state)}</Provider>,
    document.getElementById('layout')
  );
}

// Socket connection
const connection = socket(api.base);
connection.on('event', function(data){});

store.subscribe(() => render(store.getState()));

axios({
  method: 'get',
  url: api.base + '/init',
  withCredentials: true
}).then(response => {

  const data = response.data;
  const loggedIn = data.access_token ? true : false;
  const authentication = {
    loggedIn: loggedIn,
    accessToken: data.access_token,
    email: data.email
  };
  const state = {
    tracks: [],
    authentication: authentication
  };

  player.init(
    data.access_token,
    callback => axios({
      method: 'get',
      url: api.base + '/token',
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

  store.dispatch({type: 'AUTHENTICATION', authentication});

  axios({
    method: 'get',
    url: api.base + '/api/tracks',
    withCredentials: true
  }).then(res => {
    const tracks = state.tracks = res.data;
    store.dispatch({type: 'TRACKS', tracks});
    render(state);
  });
});
