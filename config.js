// OAuth - 
module.exports = {
  oauth: {
    client_id: '33fc61c99b8a4625be35535cc4a26f07',
    redirect_uri: 'http://localhost:3000/callback',
    response_type: 'code',
    scope: [
      'playlist-modify-public',
      'playlist-modify-private',
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
