import React        from 'react';
import ReactDOM     from 'react-dom';
import { Provider } from 'react-redux';
import axios        from 'axios';
import socket       from 'socket.io-client';
import router       from './router.jsx';
import player       from './player';
import store        from './store';
import { api }      from './config';

const render = () => ReactDOM.render(
  <Provider store={store}>{router(store.getState())}</Provider>,
  document.getElementById('layout')
);

const jobAction = (job) => 
  store.dispatch({type: 'JOB', job});

const jobProgressAction = (jobProgress) => 
  store.dispatch({type: 'JOB_PROGRESS', jobProgress});

const authAction = (authentication) => 
  store.dispatch({type: 'AUTHENTICATION', authentication});

const playerDeviceAction = (id) =>
  store.dispatch({type: 'PLAYER_DEVICE_ID', id});

const playerStateAction = (data) =>
  store.dispatch({type: 'PLAYER_STATE', data});

const tracksAction = (tracks) =>
  store.dispatch({type: 'TRACKS', tracks});

const getJob = () => axios({
  method: 'get',
  url: api.base + '/job',
  withCredentials: true
}).then(jobAction);

const getTracks = () => axios({
  method: 'get',
  url: api.base + '/api/tracks',
  withCredentials: true
}).then(res => {
  tracksAction(res.data);
  render();
});

axios({
  method: 'get',
  url: api.base + '/init',
  withCredentials: true
}).then(response => {

  const data = response.data;

  // Auth:
  const loggedIn = data.access_token ? true : false;
  if (!loggedIn) return render();
  authAction({
    loggedIn: loggedIn,
    accessToken: data.access_token,
    email: data.email
  });

  // Jobs connection
  const connection = socket(api.base);
  connection.on('job-progress', (data) => {
    jobProgressAction(data);
    render();
  });
  connection.on('job', (data) => {
    jobAction(data);
    getTracks();
    render();
  });
  data.job ? jobAction(data.job) : getJob();

  // Player set up:
  player.init(
    () => axios({
      method: 'get',
      url: api.base + '/token',
      withCredentials: true
    }).then(res => res.data.access_token),
    (event, data) => {
      switch (event) {
        case 'deviceId': return playerDeviceAction(data);
        case 'state': return playerStateAction(data);
      }
    }
  );

  // Tracks:
  getTracks();

  // Initiaal render;
  render();
});
