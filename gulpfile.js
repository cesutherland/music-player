var gulp = require('gulp');
var gib = require('gib');
var historyApiFallback = require('connect-history-api-fallback');

gib(gulp, {
  server: {
    root: './public',
    middleware: [historyApiFallback()]
  },
  browserify: {
    src: './src/index.js',
    dest: './public/app.js'
  },
  less: {
    src: './src/index.less',
    watch: './src/**/*.less',
    dest: './public/app.css'
  },
  html: {
    name: 'assets',
    src: './src/index.html',
    dest: './public'
  },
  fonts: {
    name: 'assets',
    src: './node_modules/bootstrap/fonts/*',
    dest: './public/fonts'
  }
});
