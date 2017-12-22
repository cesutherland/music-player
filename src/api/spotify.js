const axios           = require('axios');
const base = 'https://api.spotify.com/v1';

function spotify (config) {
  return {
    getTracks: function (offset, limit) {
      const data = {
        offset: offset ? offset : 0,
        limit: limit ? limit : 50
      };
      return this.request('get', '/me/tracks', data);
    },
    request: (method, path, data) => axios({
      method: method,
      url: base+path,
      headers: {
        'Authorization': 'Bearer '+config.access_token
      },
      data: method !== 'get' ? data : null,
      params: method === 'get' ? data : null
    }).then(response => response.data)
  };
}

module.exports = spotify;
