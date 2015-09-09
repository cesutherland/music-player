var env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    apiURL: 'http://127.0.0.1:8100'
  },
  latest: {
    apiURL: 'http://127.0.0.1:8100'
  },
  production: {
    apiURL: 'http://127.0.0.1:8100'
  }
};

if (env === 'local') {
  config = require('./config-local');
} else {
  config = config[env];
}

module.exports = config;
