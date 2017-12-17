const axios           = require('axios');
const base = 'https://api.spotify.com/v1';

function spotify (config) {
  return {
    get: path => axios({
      method: 'get',
      url: base+path,
      headers: {
        'Authorization': 'Bearer '+config.access_token
      }
    }).then(response => response.data)
  };
}

module.exports = spotify;
