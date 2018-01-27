// Modules:
const express         = require('express');
const bodyParser      = require('body-parser');
const cors            = require('cors')
const path            = require('path');
const knex            = require('knex');
const socketio        = require('socket.io');
const http            = require('http');
const Session         = require('express-session')
const SessionStorage  = require('connect-session-knex')(Session);
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

const knexInstance = knex(knexfile[process.env.NODE_ENV || 'development']);
const storeInstance = new SessionStorage({
  knex: knexInstance
});

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
  oauthRoutes.getOAuth(req).then(data => {
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
const server = http.createServer(app);
const session = Session({
  secret: 'keyboard cat',
  saveUninitialized: true,
  resave: false,
  store: storeInstance
});

app.use(cors({
  origin: config.web.base,
  credentials: true
}));
app.use(session);
app.use(bodyParser.json());
app.use(knexMiddleware);


// Io:
const io = socketio(server);
const ioMiddleware = (req, res, next) => {
  req.io = io;
  req.getSocket = () => io.sessions[req.sessionID];
  next();
};
io.use(function(socket, next) {
  session(socket.handshake, {}, next);
});
io.sessions = {};
io.on('connection', (socket) => {
  const sessionID = socket.handshake.sessionID;
  io.sessions[sessionID] = socket;
  socket.on('disconnect', () => delete io.sessions[sessionID]);
});


// Bootstrap:
app.use('/', express.static(path.join(__dirname, '../public')))
app.get('/logout', (req, res) => {
  storeInstance.destroy(req.sessionID, (err) => {
    res.redirect(config.web.base);
  });
});
app.get('/init', knexMiddleware, (req, res) => {
  oauthRoutes.getOAuth(req).then(data =>
    data
    ? res.send({
      email: data.email,
      access_token: data.access_token
    })
    : res.send({
    })
  );
});


// OAuth2:
app.get('/callback', knexMiddleware, oauthMiddleware, oauthRoutes.callback);
app.get('/token', knexMiddleware, oauthMiddleware, oauthRoutes.token);


// Jobs:
app.get('/job', knexMiddleware, spotifyMiddleware, ioMiddleware, jobRoutes.job);


// API:
app.all('/api/spotify/*', spotifyMiddleware, apiRoutes.spotify);
app.get('/api/tracks', apiRoutes.tracks);


// Start server:
const port = process.env.PORT || 3000;
server.listen(port, function (err) {
  if (err) {
    console.error(err);
  } else {
    console.log(`server started on ${port}`);
  }
});
