// Modules:
const express         = require('express');
const session         = require('express-session')
const bodyParser      = require('body-parser');
const cors            = require('cors')
const path            = require('path');
const knex            = require('knex');
const SessionStorage  = require('connect-session-knex')(session);
const config          = require('../config');
const knexfile        = require('../knexfile');
const spotify         = require('./api/spotify');
const oauth           = require('./api/oauth');
const oauthRoutes     = require('./routes/oauth');
const jobRoutes       = require('./routes/jobs');
const apiRoutes       = require('./routes/api');


// Config:
const oauthConfig = {
  client_id: config.oauth.client_id,
  client_secret: process.env.ALTPLAYER_CLIENT_SECRET,
  redirect_uri: config.oauth.redirect_uri
};

const knexInstance = knex(knexfile.development);

const getOAuth = (userId) =>
  knexInstance('oauth')
    .select('*')
    .where({user_id: userId || null})
    .then(oauths => { return oauths[0]; });

// Middleware:
const oauthMiddleware = (req, res, next) => {
  req.oauthDestination = config.web.base;
  req.oauth = oauth(oauthConfig);
  next();
};

const knexMiddleware = (req, res, next) => {
  req.knex = knexInstance
  next();
};

const spotifyMiddleware = (req, res, next) => {
  getOAuth(req.session.userId).then(data => {
    req.spotify = spotify({
      oauth: oauth(oauthConfig),
      access_token: data.access_token,
      refresh_token: data.refresh_token
    });
    next();
  });
};


// App:
const app = express();
app.use(cors({
  origin: config.web.base,
  credentials: true
}));
app.use(session({
  secret: 'keyboard cat',
  saveUninitialized: true,
  resave: true,
  store: new SessionStorage({
    knex: knexInstance
  })
}));
app.use(bodyParser.json());
app.use(knexMiddleware);


// Bootstrap:
app.use('/', express.static(path.join(__dirname, '../public')))
app.get('/init', (req, res) => {
  getOAuth(req.session.userId).then(data =>
    data
    ? res.send({
      email: session.email,
      access_token: data.access_token
    })
    : res.send({
    })
  );
});


// OAuth2:
app.get('/callback', oauthMiddleware, oauthRoutes.callback);
app.get('/token', oauthMiddleware, oauthRoutes.token);


// Jobs:
app.get('/job', spotifyMiddleware, jobRoutes.job);


// API:
app.all('/api/spotify/*', spotifyMiddleware, apiRoutes.spotify);
app.get('/api/tracks', apiRoutes.tracks);


// Start server:
const port = process.env.PORT || 3000;
app.listen(port, function (err) {
  if (err) {
    console.error(err);
  } else {
    console.log(`server started on ${port}`);
  }
});
