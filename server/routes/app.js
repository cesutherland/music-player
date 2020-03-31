const config      = require('../../config');

const logout = (req, res) => {
  return req.session.destroy((err) => {
    return res.redirect(config.web.base)
  });
}

const init = (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.send({});
  }

  return req.store.findOAuth(userId).then(data =>
    req.knex('jobs')
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
