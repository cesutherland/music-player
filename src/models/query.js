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
      'artist',
      'album'
    ]
  },
  initialize: function (attributes, options) {

    var tracks = this.tracks = options.tracks;

    var values = this._getValues(tracks);

    this.dimensions = new Collection([
      {
        id: 'album',
        label: 'Album'
      },
      {
        id: 'artist',
        label: 'Artist'
      },
      /*
      {
        id: 'genre',
        label: 'Genre'
      },
      {
        id: 'mood',
        label: 'Mood',
        values: values.mood
      },
      {
        id: 'writer',
        label: 'Writer',
        values: values.writer
      },
      */
      {
        id: 'copyrightYear',
        label: 'Year'
      }
    ]);

    this
      .on('change:hierarchy', this.onHierarchy, this);
  },

  _getValues: function (tracks) {

    var fields = [
      'mood',
      'writer'
    ];
    var values = {};
    var i;
    for (i = 0; i < fields.length; i++) {
      values[fields[i]] = {};
    }

    tracks.each(function (track) {
      var i, j, value;
      for (i = 0; i < fields.length; i++) {
        value = track.get(fields[i]) || [];
        for (j = 0; j < value.length; j++) {
          values[fields[i]][value[j]] = true;
        };
      }
    });

    for (i = 0; i < fields.length; i++) {
      values[fields[i]] = getValues(values[fields[i]]);
    }

    function getValues (values) {
      values = _.keys(values);
      values.sort(compare);
      return values;
    }

    function compare (a, b) {
      return a.localeCompare(b);
    }

    return values;
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
