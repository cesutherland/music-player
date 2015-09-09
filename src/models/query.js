/**
 * Query Model
 */

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

  onHierarchy: function () {
    this.set('filter', []);
  }

});
