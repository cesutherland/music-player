const spotifyAPI = require('../api/spotify');

const getOAuth = (req) =>
  req.knex('oauth')
    .select('*')
    .innerJoin('users', 'users.id', 'oauth.user_id')
    .where({user_id: req.session.userId || null})
    .then(oauths => { return oauths[0]; });

const initSession = (req, user, accessToken, refreshToken) => {
  const knex = req.knex;
  const session = req.session;
  session.userId = user.id;
  session.email = user.email;
  getOAuth(req).then(oauth => {
    if (!oauth) {
      return knex('oauth').insert({
        user_id: user.id,
        key: 'spotify',
        access_token: accessToken,
        refresh_token: refreshToken,
        connected: true
      });
    } else if (!oauth.connected) {
      // store new connection
    } else {
      // connected
    }
  });
}

const callback = (req, res) => req.oauth.token(req.query.code).then(

  data => {

    const accessToken = data.access_token;
    const refreshToken = data.refresh_token;
    const knex = req.knex;
    const spotify = spotifyAPI({
      oauth: req.oauth,
      access_token: accessToken,
      refresh_token: refreshToken
    });

    console.error(data);

    // Get session user:
    spotify.getMe().then(me => {
      knex('users').select('*').where({email: me.email}).then(users => {
        const user = users[0];
        if (user) {
          initSession(req, user, accessToken, refreshToken);
          res.redirect(req.oauthDestination);
        } else {
          knex('users').insert({email: me.email}).then(resp => {
            initSession(req, {id: resp[0], email: me.email}, accessToken, refreshToken);
            res.redirect(req.oauthDestination);
          });
        };
      });
    });
  },
  error => {
    console.error('error');
    console.log(error.response);
  }
);

const token = (req, res) => getOAuth(req)
  .then(oauth => oauth && req.oauth.refresh(oauth.refresh_token))
  .then(
    data => {
      const update = {
        access_token: data.access_token,
        connected: true
      };
      if (data.refresh_token) {
        update.refresh_token = data.refresh_token;
      }
      console.log(update);
      console.log({
        user_id: req.session.userId,
        key: 'spotify'
      });
      return req.knex('oauth')
        .update(update)
        .where({
          user_id: req.session.userId,
          key: 'spotify'
        }).then(() => {
          req.session.access_token = data.access_token;
          res.send({
            access_token: req.session.access_token
          });
        });
    },
    error => {
      console.error('error');
      console.log(error.response);
    }
  );

module.exports = {
  getOAuth,
  callback,
  token
};
