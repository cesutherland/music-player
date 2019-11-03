/**
 * Routes
 */
const oauthRoutes = require('./oauth');
const jobRoutes   = require('./jobs');
const apiRoutes   = require('./api');
const config      = require('../../config');

const routes = (
  app,
  knexMiddleware,
  oauthMiddleware,
  spotifyMiddleware,
  ioMiddleware
) => {

  // App:
  app.get('/logout', logout);
  app.get('/init', knexMiddleware, init);

  // OAuth2:
  app.get('/callback', knexMiddleware, oauthMiddleware, oauthRoutes.callback);
  app.get('/token', knexMiddleware, oauthMiddleware, oauthRoutes.token);

  // Jobs:
  app.get('/job', knexMiddleware, spotifyMiddleware, ioMiddleware, jobRoutes.job);

  // API:
  app.all('/api/spotify/*', spotifyMiddleware, apiRoutes.spotify);
  app.get('/api/tracks', apiRoutes.tracks);
};

// App:
const logout = (req, res) => {
  return req.session.destroy((err) => {
    return res.redirect(config.web.base)
  });
}

const init = (req, res) => {
  return oauthRoutes.getOAuth(req).then(data =>
    !data
    ? res.send({})
    : req.knex('jobs')
      .where({
        user_id: req.session.userId || null
      })
      .limit(1)
      .orderBy('id', 'desc')
      .then(jobs => res.send({
        job: jobs[0] || null,
        email: data.email,
        access_token: data.access_token
      }))
  );
};

module.exports = routes;
