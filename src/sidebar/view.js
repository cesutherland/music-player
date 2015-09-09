var Layout = require('app/views/layout');
var Tracks = require('app/collections/tracks');
var PickerView = require('app/sidebar/picker');
var _ = require('underscore');

module.exports = Layout.extend({
  template: require('app/sidebar/view.hbs'),
  events: {
    'click .filter': 'handleFilterClick',
    'click .expand': 'handleExpandClick',
    'keyup .search': 'handleSearch',
    'change .search': 'handleSearch'
  },

  initialize: function () {
    var model = this.model;
    var pickerView = this.pickerView = new PickerView({
      model: model
    });

    this
      .setView(pickerView, '.picker-view')
      .listenTo(model, 'change:filter', this.onFilter)
      .listenTo(model, 'change:hierarchy', this.onHierarchy);
  },

  getRenderData: function () {
    var tracks = this.collection;
    var hierarchy = this.model.get('hierarchy');
    hierarchy = hierarchy.slice(0, hierarchy.length);

    function layout (hierarchy, tracks, level) {
      var dimension = hierarchy[0];
      level = level || 0;
      if (dimension) {
        return _.map(tracks.groupBy(dimension), function (value, key) {
          return {
            name: key,
            level: level,
            count: value.length,
            tree: layout(hierarchy.slice(1, hierarchy.length), new Tracks(value), level + 1)
          };
        });
      }
    }
    var tree = layout(hierarchy, tracks);

    return {
      tree: tree
    };
  },

  // Event handlers:

  handleFilterClick: function (e) {
    var model = this.model;
    var $node = this.$(e.target);
    var filter = [];
    while (($node = $node.closest('.node')) && $node.size()) {
      filter.unshift($node.data('filter'));
      $node = $node.parent();
    }
    model.set('filter', _.isEqual(filter, model.get('filter')) ? [] : filter);
  },
  handleExpandClick: function (e) {
    this.$(e.target).closest('.node').toggleClass('expanded');
  },
  handleSearch: function (e) {
    var search = this.$(e.target).val();
    this.model.set('search', search);
  },

  // Observer handlers:

  onFilter: function (model, filter) {
    if (filter && filter.length) {
      var level = filter.length - 1;
      this.$('.filter.selected').removeClass('selected');
      this.$('li.node[data-level="'+level+'"][data-filter="'+filter[level]+'"]')
        .find('> .filter').addClass('selected');
    } else {
      this.$('.filter').removeClass('selected');
    }
  },
  onHierarchy: function () {
    this.render();
  }
});
