// Modules:
const express         = require('express');
const session         = require('express-session')
const bodyParser      = require('body-parser');
const cors            = require('cors')
const MemcachedStore  = require('connect-memcached')(session)
const config          = require('../config');
const spotify         = require('./api/spotify');
const oauth           = require('./api/oauth');
const knexfile        = require('../knexfile');
const knex            = require('knex')(knexfile.development);
const path            = require('path');

// Config:
const app             = express();
const web             = 'http://localhost:8080/';
const oauthConfig = {
  client_id: config.oauth.client_id,
  redirect_uri: config.oauth.redirect_uri
};


// App:
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true
}));
app.use(session({
  secret: 'keyboard cat',
  saveUninitialized: true,
  resave: true,
  /*
  store: new MemcachedStore({
    hosts: ['127.0.0.1:11211']
  })
  */
}));
app.use(bodyParser.json());

const oauthMiddleware = (req, res, next) => {
  req.oauth = oauth(oauthConfig);
  next();
};

const spotifyMiddleware = (req, res, next) => {
  req.spotify = spotify({
    oauth: oauth(oauthConfig),
    access_token: req.session.access_token,
    refresh_token: req.session.refresh_token
  });
  next();
};

console.log(path.join(__dirname, '../public'));
app.use('/', express.static(path.join(__dirname, '../public')))

app.get('/hello', oauthMiddleware, function (req, res) {
  res.send(['hello']);
});

app.get('/callback', oauthMiddleware, function (req, res) {
  req.oauth.token(req.query.code).then(
    data => {
      req.session.access_token = data.access_token;
      req.session.refresh_token = data.refresh_token;
      res.redirect(web);
    },
    error => {
      console.error('error');
      console.log(error.response);
    }
  );
});

app.get('/token', oauthMiddleware, function (req, res) {
  req.oauth.refresh(req.session.refresh_token).then(
    data => {
      req.session.access_token = data.access_token;
      res.send({
        access_token: req.session.access_token
      });
    },
    error => {
      console.error('error');
      console.log(error.response);
    }
  );
});


app.get('/init', (req, res) => {
  const session = req.session;
  res.send({
    access_token: session.refresh_token && session.access_token
  });
});

app.get('/job', spotifyMiddleware, (req, res) => {

  const storeTracks = (tracks) => {
    const track = tracks.shift();
    if (track) {
      return knex('tracks').where({id: track.track.id})
        .then(tracks => tracks.length || knex('tracks').insert({id: track.track.id, track: JSON.stringify(track.track)}))
        .then(() => storeTracks(tracks));
    }
  }

  const collectAllPlaylistTracks = (playlists) => {
    const playlist = playlists.shift();
    if (playlist) {
      console.log('syncing', playlist.name);
      console.log('remaining:', playlists.length);
      return req.spotify.collectPlaylistTracks(playlist.owner.id, playlist.id)
        .then(storeTracks)
        .then(() => collectAllPlaylistTracks(playlists))
    }
  }

  return req.spotify.collectPlaylists()
    .then(collectAllPlaylistTracks)
    .then(
      tracks => res.send('ok'),
      error => (console.log(error) && res.send(error.response.data))
    );

  // Collecy tracks:
  req.spotify.collectTracks()
    .then(storeTracks)
    .then(
      tracks => res.send('ok'),
      error => console.error(error)
    );
});

// Spotify proxy:
app.all('/api/spotify/*', spotifyMiddleware, (req, res) => {
  const method = req.method.toLowerCase();
  const path = req.path.replace(/^\/api\/spotify/i, '');
  req.spotify.request(method, path, req.body, req.query).then(
    data => res.send(data),
    error => console.error(error.response)
  );
});

app.get('/api/tracks', (req, res) => {
  knex('tracks').select('*').then(tracks =>
    res.send(tracks.map(track => JSON.parse(track.track))));
});

const port = process.env.PORT || 3000;
app.listen(port, function (err) {
  if (err) {
    console.error(err);
  } else {
    console.log(`server started on ${port}`);
  }
});
