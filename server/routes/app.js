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

  return req.store.findOAuth(userId).then(user =>
    req.store.findJob(userId).then(job =>
      res.send({
        job: job || null,
        email: user.email,
        access_token: user.access_token
      })
    )
  );
};

module.exports = {
  logout,
  init
};
