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
const routes          = require('./routes');
const oauthRoutes     = require('./routes/oauth');
const store           = require('./store');


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

const storeMiddleware = (req, res, next) => {
  req.store = store(knexInstance);
  next();
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
app.use(storeMiddleware);

// Io:
const io = socketio(server, {transports: ['polling']});
const ioMiddleware = (req, res, next) => {
  req.io = io;
  req.getSocket = () => io.users[req.session.userId];
  next();
};
io.use(function(socket, next) {
  session(socket.handshake, {}, next);
});
io.users = {};
io.on('connection', (socket) => {
  const userId = socket.handshake.session.userId;
  if (userId) {
    io.users[userId] = socket;
    socket.on('disconnect', () => delete io.users[userId]);
  }
});

// Routes:
app.use('/', express.static(path.join(__dirname, '../public')))
routes(app, oauthMiddleware, spotifyMiddleware, ioMiddleware);

// Start server:
const port = process.env.PORT || 3000;
server.listen(port, function (err) {
  if (err) {
    console.error(err);
  } else {
    console.log(`server started on ${port}`);
  }
});
