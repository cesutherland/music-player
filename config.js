const dotenv = require('dotenv');

dotenv.config();

// Environment config:
const {
  ALTPLAYER_API_BASE: apiBase,
  ALTPLAYER_WEB_BASE: webBase,
  ALTPLAYER_CLIENT_ID: clientId,
} = process.env;


// Application config:
module.exports = {
  web: {
    base: webBase,
  },
  api: {
    base: apiBase,
  },
  oauth: {
    client_id: clientId,
    redirect_uri: `${apiBase}/callback`,
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
      'user-read-birthdate',
      'user-read-currently-playing',
      'user-read-email',
      'user-read-private',
    ].join(' '),
  },
};
