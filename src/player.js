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
    name: "Carly Rae Jepsen Player",
    getOAuthToken: function (callback) {
      if (!useCallback || !tokenCallback) {
        callback(token);
        useCallback = true;
      } else {
        tokenCallback(callback);
      }
    },
    volume: 0.5
  });
  player.connect();
  player.on('ready', data => {
    let { device_id } = data;
    trigger('deviceId', device_id);
  });
  setInterval(() => {
    player.getCurrentState().then(state => {
      if (state) {
        trigger('state', state);
      }
    });
  }, 500);
  return player;
}

module.exports = player; 
