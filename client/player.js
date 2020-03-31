import axios   from 'axios';
import Promise from 'promise';

var resolve, reject, token, ready, tokenCallback, trigger;

const player = new Promise((res, rej) => {
  resolve = res;
  reject = rej;
});

player.init = (oauthToken, oauthTokenCallback, eventTrigger) => {
  token = oauthToken;
  tokenCallback = oauthTokenCallback;
  trigger = eventTrigger;
  if (ready) {
    resolve(getPlayer(oauthToken));
  }
};

window.onSpotifyWebPlaybackSDKReady = () =>
  token
  ? resolve(getPlayer(token))
  : ready = true;

function getPlayer (token) {

  var useCallback = false;
  var player = new Spotify.Player({
    name: "altplayer",
    getOAuthToken: function (callback) {
      if (!useCallback || !tokenCallback) {
        console.info('player init with token')
        callback(token);
        useCallback = true;
      } else {
        console.info('player init with callback');
        tokenCallback(callback);
      }
    },
    volume: 0.5
  });

  // Errors:
  const logError = (error) => console.error(error);
  player.on('initialization_error', logError);
  player.on('authentication_error', logError);
  player.on('account_error', logError);
  player.on('playback_error', logError);

  // Connect:
  player.on('ready', ({device_id}) => trigger('deviceId', device_id));
  player.connect();

  // Status:
  setInterval(() => {
    player.getCurrentState().then(state => {
      if (state) {
        console.log(state);
        trigger('state', state);
      }
    });
  }, 500);
  return player;
}

export default player; 
