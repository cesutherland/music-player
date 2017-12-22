// Modules:
const express         = require('express');
const session         = require('express-session')
const bodyParser      = require('body-parser');
const cors            = require('cors')
const MemcachedStore  = require('connect-memcached')(session)
const config          = require('./config');
const spotify         = require('./api/spotify');
const oauth           = require('./api/oauth');

// Config:
const app             = express();
const web             = 'http://localhost:8081/';
const oauthConfig = {
  client_id: config.oauth.client_id,
  redirect_uri: config.oauth.redirect_uri
};


// App:
app.use(cors({
  origin: 'http://localhost:8081',
  credentials: true
}));
app.use(session({
  secret: 'keyboard cat',
  saveUninitialized: true,
  resave: true,
  store: new MemcachedStore({
    hosts: ['127.0.0.1:11211']
  })
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

app.get('/', function (req, res) {
  res.send('hello world: '+JSON.stringify(req.session));
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


app.get('/init', (req, res) => {
  res.send({
    access_token: req.session.access_token
  });
});

// Spotify proxy:
app.all('/api/spotify/*', spotifyMiddleware, (req, res) => {
  const method = req.method.toLowerCase();
  const path = req.path.replace(/^\/api\/spotify/i, '');
  req.spotify.request(method, path, req.body).then(
    data => res.send(data),
    error => console.error(error.response)
  );
});


app.listen(3000);
