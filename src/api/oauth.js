const axios           = require('axios');
const querystring     = require('querystring');

function oauth (config) {
  return {
    token: (code) => {
      return axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        auth: {
          username: config.client_id,
          password: config.client_secret
        },
        data: querystring.stringify({
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: config.redirect_uri
        }),
        headers: {
          'Content-type': 'application/x-www-form-urlencoded'
        }
      }).then(response => response.data);
    }
  }
};

module.exports = oauth;
