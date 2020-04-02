import axios       from 'axios';
import querystring from 'querystring';

function oauth (config) {

  function token (data) {
    return axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      auth: {
        username: config.client_id,
        password: config.client_secret
      },
      data: querystring.stringify(data),
      headers: {
        'Content-type': 'application/x-www-form-urlencoded'
      }
    }).then(response => response.data);
  }

  return {
    token: (code) => token({
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirect_uri
    }),
    refresh: (refreshToken) => token({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  }
};

export default oauth;
