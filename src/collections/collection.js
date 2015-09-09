/**
 * Base Collection
 */

var Backbone = require('backbone');

module.exports = Backbone.Collection.extend({
  parse: function (response, options) {
    return response.items;
  }
});
