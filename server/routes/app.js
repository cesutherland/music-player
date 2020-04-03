import config from '../../config';
import {progress} from './jobs';

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
    req.store.findJob(userId).then(job => {
      return res.send({
        job: job || null,
        jobProgress: job && progress(job.id) || null,
        email: user.email,
        access_token: user.access_token
      })
    })
  );
};

export default {
  logout,
  init
};
