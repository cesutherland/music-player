const oauthRoutes = require('./oauth');
const config      = require('../../config');

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

module.exports = {
  logout,
  init
};
