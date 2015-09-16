var _ = require('underscore');
var Layout = require('app/views/layout');
var Tracks = require('app/collections/tracks');
var TracksList = require('app/tracks/list');
var SidebarView = require('app/sidebar/view');

module.exports = Layout.extend({
  template: require('app/tracks/layout.hbs'),
  initialize: function (options) {
    var query = this.query = options.query;
    var collection = this.collection;
    var tracks = this.tracks = new Tracks(collection.models);
    var tracksList = this.tracksList = new TracksList({
      collection: tracks
    });
    var sidebarView = this.sidebarView = new SidebarView({
      collection: collection,
      model: query
    });

    this
      .setView(tracksList, '.tracks-list')
      .setView(sidebarView, '.sidebar-view')
      .listenTo(query, 'change:filter', this.onFilter)
      .listenTo(query, 'change:search', this.onSearch);
  },

  queryTracks: function () {

    var query = this.query;
    var search = (query.get('search') || '').toLowerCase();
    var filter = query.get('filter');
    var hierarchy = query.get('hierarchy');
    this.tracks.reset(this.collection.filter(function (model) {

      // Query:
      var queryMatch = !query || (
        (model.get('title') || '').toLowerCase().indexOf(search) >= 0 ||
        (model.get('album') || '').toLowerCase().indexOf(search) >= 0 ||
        (model.get('genre') || '').toLowerCase().indexOf(search) >= 0
      );
      // Filters:
      var filterMatch = true;
      var value = '';
      for (var i = 0; i < hierarchy.length; i++) {
        value = model.get(hierarchy[i]);
        filterMatch = filterMatch && (!filter[i] || filter[i] === value || (value.indexOf && value.indexOf(filter[i]) >= 0));
      }
      return filterMatch && queryMatch;
    }));
  },

  // Observer handlers:

  onFilter: function () {
    this.queryTracks();
  },
  onSearch: _.debounce(function () {
    this.queryTracks();
  }, 150)

});
