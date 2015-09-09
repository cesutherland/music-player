var gib = require('gib');
var git = require('git-rev');
var gulp = require('gulp');
var _ = require('underscore');
var config = require('./config');

// Grab git sha:
// Async but fast enough.
git.long(function (str) {
  config.sha = str;
});

var config = {
  build: './public',
  js: {
    'scripts/app.js': {
      browserify: {
        // Passes through to browserify exposing `require` and `./app/src/index.js` module.
        require: './src/index.js'
      },
      src: './src/index.js'
    }
  },
  less: {
    'styles/app.css': {
      paths: [
        './node_modules/',
        './theme/'
      ],
      watch: './src/styles/**/*.less',
      src: './src/styles/index.less'
    }
  },
  assets: {
    //'fonts': './node_modules/font-awesome/fonts/**/*',
    //'': [
    //  './app/assets/**/*',
    //  './site/assets/**/*'
    //]
  },
  index: {
    'index.html': {
      src: './src/markup/index.html',
      data: {
        config: config
      }
    }
  }
};

// Populate gulp file:
gib.gulpfile(config, gulp);
