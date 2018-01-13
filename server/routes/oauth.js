module.exports = {
  callback: function (req, res) {
    req.oauth.token(req.query.code).then(
      data => {
        req.session.access_token = data.access_token;
        req.session.refresh_token = data.refresh_token;
        res.redirect(req.oauthDestination);
      },
      error => {
        console.error('error');
        console.log(error.response);
      }
    );
  },
  token: function (req, res) {
    req.oauth.refresh(req.session.refresh_token).then(
      data => {
        req.session.access_token = data.access_token;
        res.send({
          access_token: req.session.access_token
        });
      },
      error => {
        console.error('error');
        console.log(error.response);
      }
    );
  }
};
