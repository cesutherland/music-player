/**
 * Routes
 */
const appRoutes   = require('./app');
const oauthRoutes = require('./oauth');
const jobRoutes   = require('./jobs');
const apiRoutes   = require('./api');


const routes = (
  app,
  knexMiddleware,
  oauthMiddleware,
  spotifyMiddleware,
  ioMiddleware
) => {

  // App:
  app.get('/logout', appRoutes.logout);
  app.get('/init', knexMiddleware, appRoutes.init);

  // OAuth2:
  app.get('/callback', knexMiddleware, oauthMiddleware, oauthRoutes.callback);
  app.get('/token', knexMiddleware, oauthMiddleware, oauthRoutes.token);

  // Jobs:
  app.get('/job', knexMiddleware, spotifyMiddleware, ioMiddleware, jobRoutes.job);

  // API:
  app.all('/api/spotify/*', spotifyMiddleware, apiRoutes.spotify);
  app.get('/api/tracks', apiRoutes.tracks);
};

module.exports = routes;
