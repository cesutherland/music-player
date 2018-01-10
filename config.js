// OAuth - 
module.exports = {
  web: {
    base: 'https://altplayer.humblesoftware.com/'
  },
  api: {
    base: 'https://altplayer.humblesoftware.com/'
  },
  oauth: {
    client_id: '33fc61c99b8a4625be35535cc4a26f07',
    redirect_uri: 'https://altplayer.humblesoftware.com/callback',
    response_type: 'code',
    scope: [
      'playlist-modify-public',
      'playlist-modify-private',
      'playlist-read-private',
      'playlist-read-collaborative',
      'streaming',
      'user-library-read',
      'user-library-modify',
      'user-modify-playback-state',
      "user-read-birthdate",
      'user-read-currently-playing',
      "user-read-email",
      "user-read-private"
    ].join(' ')
  }
};
