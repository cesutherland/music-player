const Promise = require('promise');

var resolve, reject, token, ready;

const player = new Promise((res, rej) => { resolve = res; reject = rej; });

player.init = (oauthToken) => ready ? resolve(getPlayer(oauthToken)) : token = oauthToken;
window.onSpotifyWebPlaybackSDKReady = () => token ? resolve(getPlayer(token)) : ready = true;

function getPlayer (token) {
  var player = new Spotify.Player({
    name: "Carly Rae Jepsen Player",
    getOAuthToken: function (callback) {
      callback(token);
    },
    volume: 0.5
  });
  player.connect();
  return player;
}

module.exports = player;
