/**
 * Routes
 */
import appRoutes   from './app';
import oauthRoutes from './oauth';
import jobRoutes   from './jobs';
import apiRoutes   from './api';

const routes = (
  app,
  oauthMiddleware,
  spotifyMiddleware,
  ioMiddleware
) => {

  // App:
  app.get('/logout', appRoutes.logout);
  app.get('/init', appRoutes.init);

  // OAuth2:
  app.get('/callback', oauthMiddleware, oauthRoutes.callback);
  app.get('/token', oauthMiddleware, oauthRoutes.token);

  // Jobs:
  app.get('/job', spotifyMiddleware, ioMiddleware, jobRoutes.job);

  // API:
  app.all('/api/spotify/*', spotifyMiddleware, apiRoutes.spotify);
  app.get('/api/tracks', apiRoutes.tracks);
};

export default routes;
