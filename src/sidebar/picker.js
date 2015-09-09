var _ = require('underscore');
var View = require('app/views/view');
var MAX_DEPTH = 3;

module.exports = View.extend({
  template: require('app/sidebar/picker.hbs'),
  className: 'hierarchy',
  events: {
    'click .item a': 'handleChange',
    'click .select': 'handleSelect',
    'click .add': 'handleAdd'
  },

  getRenderData: function () {
    var model = this.model;
    var hierarchy = this.model.get('hierarchy');

    dimensions = _.map(model.dimensions.filter(function (dimension) {
      return hierarchy.indexOf(dimension.id) === -1;
    }), function (dimension) {
      return dimension.toJSON();
    });

    hierarchy = _.map(hierarchy, function (id, i) {
      var data = model.dimensions.get(id).toJSON();
      data.level = i;
      data.last = i === hierarchy.length - 1;
      return data;
    });

    return {
      add: hierarchy.length < MAX_DEPTH,
      hierarchy: hierarchy,
      dimensions: dimensions
    };
  },
  afterRender: function () {
    this.$('.dropdown').hide();
  },

  handleChange: function (e) {
    this.level = this.$(e.target).data('level');
    this.$('.dropdown').toggle();
  },
  handleAdd: function () {
    this.level = this.model.get('hierarchy').length;
    this.$('.dropdown').toggle();
  },
  handleSelect: function (e) {
    var model = this.model;
    var hierarchy = model.get('hierarchy');
    hierarchy = hierarchy.slice(0, this.level + 1);
    hierarchy[this.level] = this.$(e.target).data('id');
    this.model.set('hierarchy', hierarchy);
  }

});
