import axios   from 'axios';
import Promise from 'promise';

let trigger    = () => {};
let fetchToken = null;
let resolve    = null;
let reject     = null;

const player = new Promise((res, rej) => {
  resolve = res;
  reject = rej;
});

player.init = (initFetchToken, initTrigger) => {
  fetchToken = initFetchToken;
  trigger = initTrigger;
};

const getOAuthToken = (callback) => {
  console.info('fetching token...');
  fetchToken && fetchToken().then(token => callback(token));
};

const errors = [
  'initialization_error',
  'authentication_error',
  'account_error',
  'playback_error',
];

window.onSpotifyWebPlaybackSDKReady = () => resolve(getPlayer());

function getPlayer () {

  var player = new Spotify.Player({
    name: "altplayer",
    getOAuthToken: getOAuthToken,
    volume: 0.5
  });

  // Errors:
  errors.forEach(type=> player.on(type, error => console.error(type, error)));

  // Connect:
  player.on('ready', ({device_id}) => trigger('deviceId', device_id));
  player.connect();

  // Status:
  setInterval(() => {
    player.getCurrentState().then(state => {
      if (state) {
        trigger('state', state);
      }
    });
  }, 500);
  return player;
}

export default player; 
