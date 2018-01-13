// Modules:
const express         = require('express');
const session         = require('express-session')
const bodyParser      = require('body-parser');
const cors            = require('cors')
const path            = require('path');
const knex            = require('knex');
const config          = require('../config');
const knexfile        = require('../knexfile');
const spotify         = require('./api/spotify');
const oauth           = require('./api/oauth');
const oauthRoutes     = require('./routes/oauth');
const jobRoutes       = require('./routes/jobs');
const apiRoutes       = require('./routes/api');


// Config:
const app             = express();
const web             = config.web.base;
const oauthConfig = {
  client_id: config.oauth.client_id,
  client_secret: process.env.ALTPLAYER_CLIENT_SECRET,
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
  resave: true
}));
app.use(bodyParser.json());


// Middleware:
const oauthMiddleware = (req, res, next) => {
  req.oauth = oauth(oauthConfig);
  next();
};

const knexMiddleware = (req, res, next) => {
  req.knex = knex(knexfile.development);
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


// Bootstrap:
app.use('/', express.static(path.join(__dirname, '../public')))
app.get('/init', (req, res) => {
  const session = req.session;
  res.send({
    access_token: session.refresh_token && session.access_token
  });
});


// OAuth2:
app.get('/callback', oauthMiddleware, oauthRoutes.callback);
app.get('/token', oauthMiddleware, oauthRoutes.token);


// Jobs:
app.get('/job', knexMiddleware, spotifyMiddleware, jobRoutes.job);


// API:
app.all('/api/spotify/*', spotifyMiddleware, apiRoutes.spotify);
app.get('/api/tracks', knexMiddleware, apiRoutes.tracks);


// Start server:
const port = process.env.PORT || 3000;
app.listen(port, function (err) {
  if (err) {
    console.error(err);
  } else {
    console.log(`server started on ${port}`);
  }
});
