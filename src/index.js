// Backbone:
var Backbone = require('backbone');
var $ = Backbone.$ = require('jquery');

// Handlebars:
var Handlebars = require('hbsfy/runtime');
Handlebars.registerPartial('sidebar/tree', require('app/sidebar/tree.hbs'));

// App:
var Tracks = require('app/collections/tracks');
var Query = require('app/models/query');
var tracks = new Tracks();

var List = require('app/views/list');

var TracksLayout = require('app/layout');

tracks.fetch().then(function () {
  var layout = new TracksLayout({
    collection: tracks,
    query: new Query()
  });
  $('.app').html(layout.render().$el);
})
