/**
 * Query Model
 */

var _ = require('underscore');
var Model = require('app/models/model');
var Collection = require('app/collections/collection');

module.exports = Model.extend({
  defaults: {
    search: '',
    filter: [
    ],
    hierarchy: [
      'genre'
    ]
  },
  initialize: function () {
    this.dimensions = new Collection([
      {
        id: 'album',
        label: 'Album'
      },
      {
        id: 'artist',
        label: 'Artist'
      },
      {
        id: 'genre',
        label: 'Genre'
      },
      {
        id: 'copyrightYear',
        label: 'Year'
      }
    ]);

    this
      .on('change:hierarchy', this.onHierarchy, this);
  },

  onHierarchy: function (model, hierarchy) {
    var filter = model.get('filter');
    var previous = model.previous('hierarchy');
    var oldFilterDimensions = previous.slice(0, filter.length);
    var newFilterDimensions = hierarchy.slice(0, filter.length);

    // If we've changed dimensions for any filters, clear the filters:
    if (!_.isEqual(oldFilterDimensions, newFilterDimensions)) {
      model.set('filter', []);
    }
  }
});
