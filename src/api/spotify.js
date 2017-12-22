const axios           = require('axios');
const base = 'https://api.spotify.com/v1';

function spotify (config) {
  return {
    request: (method, path, data) => axios({
      method: method,
      url: base+path,
      headers: {
        'Authorization': 'Bearer '+config.access_token
      },
      data: data
    }).then(response => response.data)
  };
}

module.exports = spotify;
