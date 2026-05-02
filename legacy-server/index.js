// Modules:
import express        from 'express';
import bodyParser     from 'body-parser';
import cors           from 'cors';
import path           from 'path';
import knex           from 'knex';
import socketio       from 'socket.io';
import http           from 'http';
import Session        from 'express-session'
import SessionStorage from 'connect-session-knex';
import config         from '../config';
import knexfile       from '../knexfile';
import spotify        from './spotify/api';
import oauth          from './spotify/oauth';
import routes         from './routes';
import oauthRoutes    from './routes/oauth';
import store          from './store';
import OAuthService   from './spotify/OAuthService';

// Config:
const oauthConfig = {
  client_id: config.oauth.client_id,
  client_secret: process.env.ALTPLAYER_CLIENT_SECRET,
  redirect_uri: config.oauth.redirect_uri
};

const knexInstance = knex(knexfile[process.env.NODE_ENV || 'development']);
const storeInstance = store(knexInstance);
const oauthInstance = oauth(oauthConfig);
const sessionStorageInstance = new (SessionStorage(Session))({
  knex: knexInstance
});
const oauthService = new OAuthService(storeInstance, oauthInstance);

// Middleware:
const oauthMiddleware = (req, res, next) => {
  req.oauthDestination = config.web.base;
  req.oauth = oauthInstance;
  req.oauthService = oauthService;
  next();
};

const knexMiddleware = (req, res, next) => {
  req.knex = knexInstance
  next();
};

const spotifyMiddleware = (req, res, next) => {
  oauthRoutes.getOAuth(req).then(data => {
    req.spotify = spotify({
      userId: req.session.userId,
      oauth: oauthService,
      access_token: data.access_token,
      refresh_token: data.refresh_token
    });
    next();
  });
};

const storeMiddleware = (req, res, next) => {
  req.store = storeInstance;
  next();
};

// App:
const app = express();
const server = http.createServer(app);
const session = Session({
  secret: 'keyboard cat',
  saveUninitialized: true,
  resave: false,
  store: sessionStorageInstance
});

app.use(cors({
  origin: config.web.base,
  credentials: true
}));
app.use(session);
app.use(storeMiddleware);
app.use(bodyParser.json());
app.use(knexMiddleware);

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
