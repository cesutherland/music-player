var spotify = require('../spotify/oauth');

class SpotifyOAuthService
{
  constructor(store, oauth)
  {
    this.store = store;
    this.oauth = oauth;
  }

  refresh (userId)
  {
    return this.store.findOAuth(userId)
      .then(oauth => oauth && this.oauth.refresh(oauth.refresh_token))
      .then(
        data => {
          console.log(data);
          const accessToken = data.access_token;
          const expires = data.expires_in + Math.floor(+new Date() / 1000);
          return this.store
            .updateOAuth(userId, accessToken, expires)
            .then(() => accessToken);
        }
      );
  }
}

module.exports = SpotifyOAuthService;
