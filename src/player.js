import axios   from 'axios';
import Promise from 'promise';

var resolve, reject, token, ready, tokenCallback;

const player = new Promise((res, rej) => { resolve = res; reject = rej; });

player.init = (oauthToken, oauthTokenCallback) => {
  tokenCallback = oauthTokenCallback;
  ready
  ? resolve(getPlayer(oauthToken))
  : token = oauthToken;
}
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
  return player;
}

module.exports = player;
