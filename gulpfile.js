var gulp = require('gulp');
var gib = require('gib');
var historyApiFallback = require('connect-history-api-fallback');

gib(gulp, {
  server: {
    root: './public',
    middleware: [historyApiFallback()]
  },
  browserify: {
    src: './client/index.js',
    dest: './public/app.js'
  },
  less: {
    src: './client/index.less',
    watch: './client/**/*.less',
    dest: './public/app.css'
  },
  html: {
    name: 'assets',
    src: './client/index.html',
    dest: './public'
  },
  fonts: {
    name: 'assets',
    src: './node_modules/bootstrap/fonts/*',
    dest: './public/fonts'
  }
});
